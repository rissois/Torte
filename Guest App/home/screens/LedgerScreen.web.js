import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Modal,
} from 'react-native';
import { getFirestore, collectionGroup, query, where, startAfter, limit, orderBy, onSnapshot, getDocs, collection } from 'firebase/firestore'

import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import { DefaultText, ExtraLargeText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import LedgerItem from '../components/LedgerItem';
import LedgerModal from '../components/LedgerModal';
import { useFocusEffect, useIsFocused, } from '@react-navigation/native';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import useModalCloser from '../../utils/hooks/useModalCloser';
import { useMyID } from '../../utils/hooks/useUser';
import firebaseApp from '../../firebase/firebase';
import Segment from '../../utils/components/Segment';

const QUERY_SIZE = 10
const LISTENER_SIZE = 5
const FETCH_THRESHOLD = 4

const firestore = getFirestore(firebaseApp)

/*
ISSUES WITH FAST REFRESH?! See commit 17a71a363
WARNING: Not removing bills that drop out of listener snapshot (in case bill "undeleted", pushing valid bill out)
NOTE: Test returning to screen after changes made in older receipt. 
*/


const useSegment = (isBill) => {
  const myID = useMyID()
  const [sortedDocuments, setSortedDocuments] = useState([])
  const [isCollectionFetched, setIsCollectionFetched] = useState(false)
  const [isFetchingCollection, setIsFetchingCollection] = useState(false)
  const [isFetchError, setIsFetchError] = useState(false)


  const collectionQuery = useMemo(() => query(
    collectionGroup(firestore, 'Bills'),
    where('user_ids', 'array-contains', myID),
    where('is_deleted', '==', false),
    orderBy('timestamps.created', 'desc')
  ), [])

  // STEP 1: Set up listeners
  // STEP 2: Fetch beyond listeners if required
  // STEP 3: Better scroll text

  const listenerNext = useCallback(querySnapshot => {
    setIsFetchingCollection(false)
    setSortedDocuments(prev => {
      let next = [...prev]
      querySnapshot.docChanges().forEach(change => {
        if (change.type === 'added') {
          const dateIndex = next.findIndex(({ timestamps: { created } }) => created.toMillis() < change.doc.data().timestamps.created.toMillis())
          if (~dateIndex) next.splice(dateIndex, 0, change.doc.data())
          else next.push(change.doc.data())
        }
        if (change.type === "modified") {
          const billIndex = next.findIndex(({ bill_id }) => bill_id === change.doc.id)
          if (~billIndex) next[billIndex] = change.doc.data()
          // Likely unnecessary
          else {
            const dateIndex = next.findIndex(({ timestamps: { created } }) => created.toMillis() < change.doc.data().timestamps.created.toMillis())
            if (~dateIndex) next.splice(dateIndex, 0, change.doc.data())
            else next.push(change.doc.data())
          }
        }
        // if (change.type === "removed") {
        //   const billIndex = next.findIndex(({ bill_id }) => bill_id === change.doc.id)
        //   if (billIndex) copy.splice(billIndex, 1)
        // }
      })
      return next
    })
    if (querySnapshot.size < LISTENER_SIZE) {
      setIsCollectionFetched(true)
    }
  }, [])

  const listenerError = useCallback(error => {
    console.log(`LedgerScreen Bill collection listener error ${error}`)
    setIsFetchError(true)
  }, [])

  useEffect(() => {
    setIsFetchingCollection(true)
    const unsubscribe = onSnapshot(
      query(collectionQuery, limit(LISTENER_SIZE)),
      listenerNext,
      listenerError,
    )
    return () => unsubscribe()
  }, [])

  const fetchMore = useCallback(async () => {
    setIsFetchingCollection(true)
    try {
      const lastDocument = sortedDocuments[sortedDocuments.length - 1]
      const queryDocs = await getDocs(collectionQuery, startAfter(lastDocument), limit(QUERY_SIZE))
      if (queryDocs.size) {
        let docs = []
        queryDocs.docs.forEach(doc => docs.push(doc.data()))
        setSortedDocuments(prev => [...prev, ...docs])
      }
      if (queryDocs.size < QUERY_SIZE) {
        setIsCollectionFetched(true)
      }

      setIsFetchError(false)
    }
    catch (error) {
      console.log(`LedgerScreen collection listener error ${error}`)
      setIsFetchError(true)
      setIsFetchingCollection(false)
    }
  }, [sortedDocuments])

  return [sortedDocuments, isFetchingCollection, isCollectionFetched, isFetchError, fetchMore]
}

const sortByTime = (a, b) => b.timestamps.created.toMillis() - a.timestamps.created.toMillis()
const mergeArraysByTime = (a, b) => [...a, ...b].sort(sortByTime)
/**
 * (UNTESTED) Trim a so that the documents only go so far as the oldest document fetched in b
 * Merges history of Bills and Receipts when switching segment from one to both
 * Rather than restarting both queries, this approach fakes it by hiding any documents beyond where they are in sync
 * @param {Array} a Documents (bills or receipts) with timestamps.created
 * @param {Array} b Documents (bills or receipts) with timestamps.created
 * @param {Boolean} isBFetched Whether B documents are fully fetched
 * @param {Number} lastBTime Time created (in millis) of the last B document
 * @returns merged array of a and b
 */
const mergeArraysUpToB = (a, b, isBFetched, lastBTime) => {
  // Return all if B is fully fetched
  if (isBFetched) return mergeArraysByTime(a, b)

  // Get the index of A, where A is no longer in sync with B
  const indexOlderA = a.findIndex(x => x.timestamps.created.toMillis() < lastBTime)
  if (!~indexOlderA) mergeArraysByTime(a, b) // I do not think this can ever occur
  return mergeArraysByTime(a.slice(0, indexOlderA), b)
}

/**
 * Fetch more bills or receipts
 * Always fetches the collection that is lagging (B)
 * But will fetch A if only FETCH_THRESHOLD A documents come after B
 * 
 * In other words, picture two "banks" of A and B
 * Get QUERY_SIZE documents of each
 * Pull out the newest documents, one by one, from each
 * If A runs out first, grab more A (or vice versa)
 * If B is also running low (FETCH_THRESHOLD), you can also grab more B
 * 
 * @param {Array} a Documents (bills or receipts) with timestamps.created
 * @param {Number} lastBTime Time created (in millis) of the last B document
 * @param {Function} fetchA Function to fetch more A documents
 * @param {Function} fetchB Function to fetch more B documents
 */
const fetchMoreAll = (a, lastBTime, fetchA, fetchB) => {
  let numberExtraA = 0
  let isAOlder = true
  for (let i = a.length - 1; i >= 0 && isAOlder; i--) {
    if (a[i].timestamps.toMillis() < lastBTime) numberExtraA++
    else isAOlder = false
  }
  if (numberExtraA <= FETCH_THRESHOLD) fetchA()
  fetchB()
}

export default function LedgerScreen({ navigation }) {
  useModalCloser('Ledger', () => setSelected(null))

  const flatListRef = useRef(null)
  const [sortedBills, isFetchingBills, isBillsFetched, isBillsError, fetchMoreBills] = useSegment(true)
  const [selected, setSelected] = useState(null)

  useFocusEffect(useCallback(() => {
    // Clear Modal if screen loses focus
    return () => setSelected(null)
  }, []));

  return <SafeView >
    <Header back>
      <LargeText center>History</LargeText>
      {/* FUTURE SEARCH BAR */}
    </Header>

    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Modal
        visible={!!selected}
        animationType='slide'
        transparent={true}
      >
        <LedgerModal
          selected={selected}
          clearModal={() => {
            setSelected(null)
          }}
        />
      </Modal>

      <FlatList
        style={{ flex: 1, marginTop: 8 }}
        ref={flatListRef}
        contentContainerStyle={{ flexGrow: 1 }}
        data={sortedBills}
        keyExtractor={(item, index) => item.id + index}
        renderItem={({ item: bill }) => <LedgerItem bill={bill} setSelected={setSelected} />}
        onEndReached={() => {
          if (!isFetchingBills && !isBillsFetched && !isBillsError) fetchMoreBills()
        }}
        onEndReachedThreshold={0.2}
        ListFooterComponent={() => <LedgerFooter
          {...{
            empty: !sortedBills.length,
            fetching: isFetchingBills,
            error: isBillsError,
            complete: isBillsFetched
          }}
        />
        }
      />
    </View>
  </SafeView>
}

const LedgerFooter = ({ empty, fetching, error, complete }) => {
  const halfScreen = () => {
    if (empty) {
      if (fetching) {
        return <IndicatorOverlay />
      }
      else if (error) {
        return <View style={{ flex: 1, justifyContent: 'center' }}>
          <MediumText bold red center>ERROR FETCHING</MediumText>
        </View>
      }
      else {
        return <View style={{ flex: 1, justifyContent: 'center' }}>
          <MediumText bold center>NONE FOUND</MediumText>
        </View>
      }
    }
  }

  return <View style={{ height: Layout.scrollViewPadBot, }}>
    {
      empty ?
        halfScreen() :
        <View style={{ paddingVertical: 8 }}>
          {
            fetching ? <DefaultText bold center>Fetching {s}</DefaultText> :
              error ? <DefaultText bold red center>Error fetching {s}</DefaultText> :
                complete ? <DefaultText bold center>End of {s}</DefaultText> : <DefaultText center>Scroll down for more</DefaultText>
          }

        </View>
    }
  </View>

}

const styles = StyleSheet.create({
  // footerView: {
  //   paddingVertical: 30,
  //   alignItems: 'center',
  //   marginBottom: Layout.window.height / 10
  // }
});