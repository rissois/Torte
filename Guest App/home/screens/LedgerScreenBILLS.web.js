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

const firestore = getFirestore(firebaseApp)

/*
ISSUES WITH FAST REFRESH?! See commit 17a71a363
WARNING: Not removing bills that drop out of listener snapshot (in case bill "undeleted", pushing valid bill out)
NOTE: Test returning to screen after changes made in older receipt. 
*/

const SEGMENTS = {
  all: 'All',
  bills: 'Order & Pay',
  receipts: 'Scanned',
}
const INITIAL_SEGMENT = Object.keys(SEGMENTS)[0]

const useSegment = (isBill) => {
  const myID = useMyID()
  const [sortedDocuments, setSortedDocuments] = useState([])
  const [isCollectionFetched, setIsCollectionFetched] = useState(false)
  const [isFetchingCollection, setIsFetchingCollection] = useState(false)
  const [isFetchError, setIsFetchError] = useState(false)


  const collectionQuery = useMemo(() => query(
    isBill ? collectionGroup(firestore, 'Bills') : collection(firestore, 'Receipts'),
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
    console.log(`LedgerScreen ${isBill ? 'Bill' : 'Receipt'} collection listener error ${error}`)
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
        bills.docs.forEach(doc => docs.push(doc.data()))
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
    }
  }, [sortedDocuments])

  return [sortedDocuments, isFetchingCollection, isCollectionFetched, isFetchError, fetchMore]
}

/*
  BILLS vs RECEIPTS
  If you query for bills only, and then switch back to all, the receipts will be out of date

  OPTION 1: Fake restarting both queries. Only pull more receipts when scrolled down
    e.g. hide any bills that date beyond the oldest receipt (+1)
  XXX OPTION 2: Query catch-up all receipts to last timestamp of the bills 
    DO NOT DO: may fetch A LOT of receipts all at once, and repositioning of scroll is non-ideal
*/

const sortByTime = (a, b) => a.timestamps.created.toMillis() - b.timestamps.created.toMillis()
const mergeArraysByTime = (a, b) => [...a, ...b].sort(sortByTime)
const test = (bills, receipts) => {
  const lastBillTime = bills[bills.length - 1]?.timestamps.created.toMillis()
}
/**
 * (UNTESTED) merges history of Bills and Receipts when switching segment from one to both
 * Rather than restarting both queries, this approach fakes it by hiding any documents beyond where they are in sync
 * @param {Array} a Documents (bills or receipts) with timestamps.created
 * @param {Array} b Documents (bills or receipts) with timestamps.created
 * @returns merged array of a and b
 */
const mergeArraysUpToB = (a, b, documentsInSync) => {
  if (b.length < LISTENER_SIZE) return mergeArraysByTime(a, b)
  // Get time of last document queried in B
  const lastBTime = b[b.length - 1].timestamps.created.toMillis()
  // Get the index of A, where A is no longer in sync with B (more A )
  const indexOlderA = a.findIndex(x => x.timestamps.created.toMillis() < lastBTime)
  if (!~indexOlderA) mergeArraysByTime(a, b)
  return mergeArraysByTime(a.slice(0, indexOlderA), b)
}

export default function LedgerScreen({ navigation }) {
  useModalCloser('Ledger', () => setSelected(null))

  const flatListRef = useRef(null)
  const [sortedBills, isFetchingBills, isBillsFetched, isBillsError, fetchMoreBills] = useSegment(true)
  const [sortedReceipts, isFetchingReceipts, isReceiptsFetched, isReceiptsError, fetchMoreReceipts] = useSegment(false)
  const [selected, setSelected] = useState(null)


  const [segment, setSegment] = useState(INITIAL_SEGMENT)

  useEffect(() => {
    // Scroll to top if segment changes
    if (flatListRef.current.props.data.length) flatListRef?.current?.scrollToIndex({ index: 0, animated: false, viewPosition: 0 })
  }, [segment])

  const data = useMemo(() => {
    if (segment.current === 'bills') return sortedBills
    else if (segment.current === 'receipts') return sortedReceipts
    else {

      // So...
      // If ONE errors or is completed, you must let the other continue
      // AND YOU TECHNICALLY ALWAYS NEED TO GO TO THE LAST OF ONE OR THE OTHER
      // oh god this becomes a clusterfuck.
      // like... why are you doing this?
      // it doesn't make sense.
      if (segment.last === 'bills') return mergeArraysUpToB(sortedReceipts, sortedBills, () => setSegment(INITIAL_SEGMENT))
      if (segment.last === 'receipts') return mergeArraysUpToB(sortedBills, sortedReceipts, () => setSegment(INITIAL_SEGMENT))
      return mergeArraysByTime(sortedBills, sortedReceipts)
    }
  }, [segment, sortedBills, sortedReceipts, isBillsFetched, isBillsError, isReceiptsError, isReceiptsFetched])

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

      <Segment
        segments={Object.keys(SEGMENTS)}
        values={Object.values(SEGMENTS)}
        segment={segment.current}
        setSegment={s => setSegment(prev => ({ current: s, last: prev.current }))}
      />

      <FlatList
        style={{ flex: 1, marginTop: 8 }}
        ref={flatListRef}
        contentContainerStyle={{ flexGrow: 1 }}
        data={data}
        keyExtractor={(item, index) => item.id + index}
        renderItem={({ item: bill }) => <LedgerItem bill={bill} setSelected={setSelected} />}
        onEndReached={() => {
          if (segment.current !== SEGMENTS.receipts) {
            const lastBill = sortedBills[sortedBills.length - 1]
            if (!isFetchingBills && !isBillsFetched && !isBillsError && ~data.lastIndexOf(x => x === lastBill)) fetchMoreBills()
          }
          if (segment.current !== SEGMENTS.bills) {
            const lastReceipt = sortedReceipts[sortedReceipts.length - 1]
            if (!isFetchingReceipts && !isReceiptsFetched && !isReceiptsError && ~data.lastIndexOf(x => x === lastReceipt)) fetchMoreReceipts()
          }
        }}
        onEndReachedThreshold={0.2}
        ListFooterComponent={() => <LedgerFooter
          segment={segment.current}
          all={{
            empty: !sortedBills.length && !sortedReceipts.length,
            fetching: isFetchingBills || isFetchingReceipts,
            error: isBillsError || isReceiptsError,
          }}
          bills={{
            empty: !sortedBills.length,
            fetching: isFetchingBills,
            error: isBillsError,
            complete: isBillsFetched
          }}
          receipts={{
            empty: !sortedReceipts.length,
            fetching: isFetchingReceipts,
            error: isReceiptsError,
            complete: isReceiptsFetched
          }}
        />
        }
      />
    </View>
  </SafeView>
}

const LedgerFooter = ({ segment, ...values }) => {
  const halfScreen = () => {
    if (values[segment].empty) {
      if (values[segment].fetching) {
        return <IndicatorOverlay />
      }
      else if (values[segment].error) {
        return <View style={{ flex: 1, justifyContent: 'center' }}>
          <MediumText bold red center>ERROR FETCHING</MediumText>
        </View>
      }
      else {
        return <View style={{ flex: 1, justifyContent: 'center' }}>
          <MediumText bold center>NONE FOUND</MediumText>
        </View>
        // does not exist
      }
    }
  }

  const bottomComponent = s => {
    if (values[s].fetching) {
      return <DefaultText bold center>Fetching {s}</DefaultText>
      // fetching
    }
    else if (values[s].error) {
      return <DefaultText bold red center>Error fetching {s}</DefaultText>
    }
    else if (values[s].complete) {
      return <DefaultText bold center>End of {s}</DefaultText>
      // all shown
    }
    else return null
  }

  const bills = bottomComponent('bills')
  const receipts = bottomComponent('receipts')

  return <View style={{ height: Layout.scrollViewPadBot, }}>
    {
      values[segment].empty ?
        halfScreen() :
        <View style={{ paddingVertical: 8 }}>
          {
            ((!bills && !receipts) || (segment === 'bills' && !bills) || (segment === 'receipts' && !receipts))
            && <DefaultText center>Scroll down for more</DefaultText>
          }
          {segment !== 'receipts' && bills}
          {segment !== 'bills' && receipts}
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