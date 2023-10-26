import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Modal,
} from 'react-native';
import { getFirestore, collectionGroup, query, where, startAfter, limit, orderBy, onSnapshot, getDocs } from 'firebase/firestore'

import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import { DefaultText, ExtraLargeText, LargeText, } from '../../utils/components/NewStyledText';
import LedgerItem from '../components/LedgerItem';
import LedgerModal from '../components/LedgerModal';
import { useFocusEffect, useIsFocused, } from '@react-navigation/native';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import useModalCloser from '../../utils/hooks/useModalCloser';
import { useMyID } from '../../utils/hooks/useUser';
import firebaseApp from '../../firebase/firebase';

const firestore = getFirestore(firebaseApp)

/*
WARNING

Currently removing bills that drop out of snapshot limit
*/

export default function LedgerScreen({ navigation }) {
  useModalCloser('Ledger', () => setSelectedBill(null))

  const myID = useMyID()
  const isFocused = useIsFocused()

  const billsQuery = useMemo(() => query(
    collectionGroup(firestore, 'Bills'),
    where('user_ids', 'array-contains', myID),
    where('is_deleted', '==', false),
    orderBy('timestamps.created', 'desc')
  ), [])

  const [paginatedBills, setPaginatedBills] = useState([])
  const [isEndOfHistory, setIsEndOfHistory] = useState(false)
  const [isFetchingBills, setIsFetchingBills] = useState(true)
  const [isFirstSnapshot, setIsFirstSnapshot] = useState(true)
  const [lastDoc, setLastDoc] = useState(null)
  const [isFetchError, setIsFetchError] = useState(false)

  const [selectedBill, setSelectedBill] = useState(null)

  useFocusEffect(useCallback(() => {
    return () => {
      // SCREEN LOSES FOCUS CODE
      setSelectedBill(null)
    };
  }, []));

  const handleRealtimeBills = useCallback(() => {
    return querySnapshot => {
      setIsFetchError(false)
      querySnapshot.docChanges().forEach((change) => {
        // Place new items in their appropriate place chronologically
        if (change.type === "added") {
          setPaginatedBills(prev => {
            let next = [...prev]

            // Prevents duplications during Fast Refresh
            if (!isFirstSnapshot) {
              let billIndex = next.findIndex(({ bill_id }) => bill_id === change.doc.id)
              if (~billIndex) {
                next[billIndex] = change.doc.data()
                return next
              }
            }

            let dateIndex = next.findIndex(({ timestamps: { created } }) => created.toMillis() < change.doc.data().timestamps.created.toMillis())
            if (~dateIndex) {
              next.splice(dateIndex, 0, change.doc.data())
            }
            else {
              next.push(change.doc.data())
            }
            return next
          })
        }
        if (change.type === "modified") {
          setPaginatedBills(prev => {
            let next = [...prev]
            let billIndex = next.findIndex(({ bill_id }) => bill_id === change.doc.id)
            if (~billIndex) {
              next[billIndex] = change.doc.data()
              return next
            }
            return prev
          })

          setSelectedBill(prev => {
            if (prev?.bill_id === change.doc.id) {
              return change.doc.data()
            }
            return prev
          })
        }
        if (change.type === "removed") { }
      });

      if (isFirstSnapshot) {
        setIsFirstSnapshot(false)

        if (querySnapshot.size < 3) {
          setIsEndOfHistory(true)
          setIsFetchingBills(false)
        }
        else if (isFocused) {
          loadMoreBills(querySnapshot.docs[querySnapshot.size - 1])
        }
      }
    }
  }, [isFirstSnapshot, isFocused])

  // Not a useFocusEffect because you cannot join a bill in the background, so the listener is OK to maintain
  useEffect(() => {
    var unsubscribe = onSnapshot(
      query(
        billsQuery,
        limit(7)
      ),
      handleRealtimeBills(),
      error => {
        setIsFetchError('snap: ', error.message)
        console.log('LedgerScreen onSnapshot error: ', error)
      }
    )

    return () => {
      unsubscribe()
    };
  }, [])

  const loadMoreBills = useCallback(async last => {
    setIsFetchingBills(true)

    try {
      const bills = await getDocs(
        billsQuery,
        startAfter(last),
        limit(15)
      )

      setIsFetchError(false)

      if (bills.size) {
        let newBills = []
        bills.docs.forEach(doc => newBills.push(doc.data()))

        setPaginatedBills(prev => [...prev, ...newBills])
        setLastDoc(bills.docs[query.docs.length - 1])
      }
      if (bills.size < 15) {
        setIsEndOfHistory(true)
      }

      setIsFetchingBills(false)
    }
    catch (error) {
      setIsFetchingBills(false)
      setIsFetchError(`load ${error.message}`)
      console.log('LedgerScreen loadMoreBills error: ', error)
    }
  }, [])


  return <SafeView >
    <Header back>
      <LargeText center>History</LargeText>
      {/* FUTURE SEARCH BAR */}
    </Header>

    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <Modal
        visible={!!selectedBill}
        animationType='slide'
        transparent={true}
      >
        <LedgerModal
          selectedBill={selectedBill}
          clearModal={() => {
            setSelectedBill(null)
          }}
        />
      </Modal>

      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={{ flexGrow: 1 }}
        data={paginatedBills}
        ListEmptyComponent={() => {
          if (isFetchingBills) {
            return <View style={{ flex: 1, justifyContent: 'center', marginHorizontal: 24 }}>
              <IndicatorOverlay text='Loading bills...' />
            </View>
          }
          return <View style={{ flex: 1, justifyContent: 'center', marginHorizontal: 40 }}>
            <ExtraLargeText center>No bills found</ExtraLargeText>
            {/* <LargeText center style={{ marginTop: 12 }}>If you think this is an error, please submit a feedback form</LargeText> */}
          </View>
        }}
        renderItem={({ item: bill }) => {
          return <LedgerItem bill={bill}
            setSelectedBill={() => {
              setSelectedBill(bill)
            }}
          />
        }}
        keyExtractor={(item, index) => item.id + index}
        onEndReached={() => {
          if (!isFetchingBills && isFocused && !isEndOfHistory) {
            loadMoreBills(lastDoc)
          }
        }}
        onEndReachedThreshold={0.2}
        ListFooterComponentStyle={styles.footerView}
        ListFooterComponent={() => {
          if (isFetchError) return <DefaultText maxScale={1.7} center bold red>Error fetching bills {isFetchError}</DefaultText>
          if (!paginatedBills.length) return null
          if (isEndOfHistory) return <DefaultText maxScale={1.7} center>No further bills to show</DefaultText>
          if (isFetchingBills) return <IndicatorOverlay horizontal text={'Loading more bills...'} />
          return <DefaultText maxScale={1.7} center>Scroll to load more</DefaultText>
        }}
      />
    </View>
  </SafeView>
}

const styles = StyleSheet.create({
  footerView: {
    paddingVertical: 30,
    alignItems: 'center',
    marginBottom: Layout.window.height / 10
  }
});