import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  FlatList,
  TouchableOpacity
} from 'react-native';

import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import { ExtraLargeText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import { useIsFocused, } from '@react-navigation/native';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import { useBill } from '../../utils/hooks/useBill';
import { useDispatch } from 'react-redux';
import { dateToClock } from '../../utils/functions/dateAndTime';
import centsToDollar from '../../utils/functions/centsToDollar';
import Bill from '../../bill/components/Bill';
import { doBillsTempClear, doBillsTempSet } from '../../redux/actions/actionsHistory';

const QUERY_SIZE = 30

export default function HistoryScreen({ navigation }) {
  const restaurantRef = useRestaurantRef()
  const dispatch = useDispatch()

  const isFocused = useIsFocused()

  const billsQuery = useMemo(() => restaurantRef
    .collection('Bills')
    .where('timestamps.closed', '!=', null)
    .orderBy('timestamps.closed', 'desc'), [])

  const [chronoBillIDs, setChronoBillIDs] = useState([])
  const [isEndOfHistory, setIsEndOfHistory] = useState(false)
  const [isFetchingBills, setIsFetchingBills] = useState(true)
  const [lastDoc, setLastDoc] = useState(null)
  const [isFetchError, setIsFetchError] = useState(false)
  const [billID, setBillID] = useState('')

  const closeBill = useCallback(() => setBillID(''), [])


  useEffect(() => loadMoreBills(), [])

  useEffect(() => {
    // Just seems like otherwise, you have a lot of staleness
    return () => dispatch(doBillsTempClear())
  }, [])

  const loadMoreBills = useCallback(last => {
    setIsFetchingBills(true)

    const q = last ? billsQuery.startAfter(last) : billsQuery


    q.limit(QUERY_SIZE)
      .get()
      .then(
        query => {
          setIsFetchError(false)

          let bills = {}
          let bill_ids = []
          query.docs.forEach(doc => {
            bills[doc.id] = doc.data()
            bill_ids.push(doc.id)
          })

          dispatch(doBillsTempSet(bills))
          setChronoBillIDs(prev => [...prev, ...bill_ids])
          setLastDoc(query.docs[query.docs.length - 1])

          if (query.size < QUERY_SIZE) {
            setIsEndOfHistory(true)
          }

          setIsFetchingBills(false)
        },
        error => {
          setIsFetchingBills(false)
          setIsFetchError(true)
          console.log('HistoryScreen loadMoreBills error: ', error)
        }
      )
  }, [])


  return <SafeView >
    <Header back>
      <ExtraLargeText center>History</ExtraLargeText>
      {/* FUTURE SEARCH BAR */}
    </Header>

    <FlatList
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      data={chronoBillIDs}
      ListEmptyComponent={() => {
        if (isFetchingBills) {
          return <View style={{ flex: 1, justifyContent: 'center', marginHorizontal: 24 }}>
            <IndicatorOverlay text='Loading bills...' />
          </View>
        }
        return <View style={{ flex: 1, justifyContent: 'center', marginHorizontal: 40 }}>
          <ExtraLargeText center>NO BILLS FOUND</ExtraLargeText>
          {/* <LargeText center style={{ marginTop: 12 }}>If you think this is an error, please submit a feedback form</LargeText> */}
        </View>
      }}
      renderItem={({ item: bill_id, index }) => {
        return <TouchableOpacity onPress={() => setBillID(bill_id)}><BillHistory bill_id={bill_id} index={index} /></TouchableOpacity>
      }}
      keyExtractor={item => item}
      onEndReached={() => {
        if (!isFetchingBills && isFocused) {
          console.log('end reached')
          loadMoreBills(lastDoc)
        }
      }}
      onEndReachedThreshold={0.2}
      ListFooterComponentStyle={styles.footerView}
      ListFooterComponent={() => {
        if (isFetchError) return <MediumText center bold red>Error fetching bills</MediumText>
        if (!chronoBillIDs.length) return null
        if (isEndOfHistory) return <MediumText center>No further bills to show</MediumText>
        if (isFetchingBills) return <IndicatorOverlay horizontal text={'Loading more bills...'} />
        return <MediumText center>Scroll to load more</MediumText>
      }}
    />

    {!!billID && <Bill bill_id={billID} closeBill={closeBill} isHistory />}

  </SafeView>
}

const BillHistory = ({ bill_id, index }) => {
  const {
    timestamps: { created, closed } = {},
    party: { party_size } = {},
    server: { name: server_name } = {},
    bill_code,
    bill_number,
    table: { name: table_name } = {},
    order_summary: {
      subtotal,
      tax,
    } = {},
    paid_summary: {
      discounts,
      tips,
    } = {},
  } = useBill(bill_id)

  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8, borderColor: Colors.white, borderBottomWidth: 1, backgroundColor: index % 2 ? Colors.background : Colors.darkgrey }}>
      <View>
        <ExtraLargeText bold>{table_name}</ExtraLargeText>
        <LargeText>#{bill_code}</LargeText>
        <LargeText>{dateToClock(created?.toDate())} - {closed ? dateToClock(closed?.toDate()) : '???'}</LargeText>
      </View>
      <View >
        <LargeText>Unique ID: {bill_number}</LargeText>
        <LargeText>{server_name || 'No server'}</LargeText>
        <LargeText>{party_size || 0} guests</LargeText>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <LargeText>Subtotal {centsToDollar(subtotal)}</LargeText>
        <LargeText>Tax {centsToDollar(tax)}</LargeText>
        {!!discounts && <LargeText>Discounts {centsToDollar(discounts)}</LargeText>}
        <LargeText>Tips {centsToDollar(tips)}</LargeText>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  footerView: {
    paddingVertical: 30,
    alignItems: 'center',
    marginBottom: Layout.window.height / 10
  }
});