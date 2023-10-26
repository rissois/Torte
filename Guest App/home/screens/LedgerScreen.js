import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  Modal,
} from 'react-native';
import firestore from '@react-native-firebase/firestore'

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


/*
WARNING

Currently removing bills that drop out of snapshot limit
*/

export default function LedgerScreen({ navigation }) {
  useModalCloser('Ledger', () => setSelectedBill(null))

  const myID = useMyID()
  const isFocused = useIsFocused()

  const billsQuery = useMemo(() => firestore()
    .collectionGroup('Bills')
    .where('user_ids', 'array-contains', myID)
    .where('is_deleted', '==', false)
    .orderBy('timestamps.created', 'desc'), [])

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
        if (change.type === "removed") {
          // Just allow to go stale, can update if improperly accessed
          // Otherwise, a new bill will push out the nth bill

          // setPaginatedBills(prev => {
          //   let next = [...prev]
          //   let billIndex = next.findIndex(({ bill_id }) => bill_id === change.doc.id)
          //   if (~billIndex) {
          //     next.splice(billIndex, 1)
          //     return next
          //   }
          //   return prev
          // })

          // setSelectedBill(prev => {
          //   if (prev.bill_id === change.doc.id) {
          //     return null
          //   }
          //   return prev
          // })
        }
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
    var unsubscribe = billsQuery
      .limit(7)
      .onSnapshot(
        handleRealtimeBills(),
        error => {
          setIsFetchError(true)
          console.log('LedgerScreen onSnapshot error: ', error)
        }
      )

    return () => {
      unsubscribe()
    };
  }, [])

  const loadMoreBills = useCallback(last => {
    setIsFetchingBills(true)

    billsQuery
      .startAfter(last)
      .limit(15)
      .get()
      .then(
        query => {
          setIsFetchError(false)
          let newBills = []
          query.docs.forEach(doc => newBills.push(doc.data()))

          setPaginatedBills(prev => [...prev, ...newBills])
          setLastDoc(query.docs[query.docs.length - 1])

          if (query.size < 15) {
            setIsEndOfHistory(true)
          }

          setIsFetchingBills(false)
        },
        error => {
          setIsFetchingBills(false)
          setIsFetchError(true)
          console.log('LedgerScreen loadMoreBills error: ', error)
        }
      )
  }, [])


  return <SafeView unsafeColor={Colors.black}>
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
          if (!isFetchingBills && isFocused) {
            console.log('TWO')

            loadMoreBills(lastDoc)
          }
        }}
        onEndReachedThreshold={0.2}
        ListFooterComponentStyle={styles.footerView}
        ListFooterComponent={() => {
          if (isFetchError) return <DefaultText maxScale={1.7} center bold red>Error fetching bills</DefaultText>
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