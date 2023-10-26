import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { DefaultText, ExtraLargeText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import { FlatList } from 'react-native-gesture-handler';
import firebase from 'firebase';
import centsToDollar from '../../utils/functions/centsToDollar';
import Layout from '../../utils/constants/Layout';
import { useDispatch, } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import StyledButton from '../../utils/components/StyledButton';
import { PortalTextField } from '../../portal/components/PortalFields';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { firstAndL } from '../../utils/functions/names';
import months from '../../utils/constants/months';

// import { selectIsTableWithMultipleBills } from '../../redux/selectors/selectorsTableStatus';


export default function BillRefunds({ bill_id, setShowRefunds }) {
  const restaurantRef = useRestaurantRef()
  const [billPayments, setBillPayments] = useState({})
  const [billRefunds, setBillRefunds] = useState({})
  const [isFetching, setIsFetching] = useState(true)

  useEffect(() => {
    const paymentListener = restaurantRef.collection('Bills').doc(bill_id).collection('BillPayments')
      .where('status', '==', 'succeeded')
      .where('type', 'in', ['app', 'charge', 'swipe', 'manual'])
      .onSnapshot(querySnapshot => {
        let payments = {}
        querySnapshot.forEach(docSnapshot => payments[docSnapshot.id] = docSnapshot.data())
        setBillPayments(prev => ({ ...prev, ...payments }))
        setIsFetching(false)
      })

    return () => {
      paymentListener()
    }
  }, [])

  useEffect(() => {
    const refundListener = restaurantRef.collection('Bills').doc(bill_id).collection('BillRefunds')
      .onSnapshot(querySnapshot => {
        let refunds = {}
        querySnapshot.forEach(docSnapshot => refunds[docSnapshot.id] = docSnapshot.data())
        setBillPayments(prev => ({ ...prev, ...refunds }))
        setIsFetching(false)
      })

    return () => {
      refundListener()
    }
  }, [])

  const sortedPaymentIDs = useMemo(() => {
    return Object.keys(payments).sort((a, b) => {
      return payments[b].timestamps.created.toMillis() - payments[a].timestamps.created.toMillis()
    })
  }, [payments])

  return <View style={{ flex: 1 }}>
    <FlatList
      keyboardShouldPersistTaps='handled'
      data={sortedPaymentIDs}
      contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: Layout.scrollViewPadBot }}
      keyExtractor={item => item}
      ListHeaderComponent={() => <ExtraLargeText center>REFUNDS</ExtraLargeText>}
      ListEmptyComponent={() => (
        Object.keys(billUsers).length
          ? <LargeText center>No users have made a refundable payment</LargeText>
          : <LargeText center>{isFetching ? 'Fetching users...' : 'No users on bill'}</LargeText>
      )}
      renderItem={({ item: user_id, }) => <Users billUser={billUsers[user_id]} billRefunds={billRefunds[user_id]} />}
    />
    {isFetching && <IndicatorOverlay text='Collecting data...' />}
  </View>
}

const Users = ({ billUser, billRefunds = {} }) => {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()
  const [amount, setAmount] = useState(0)
  const [reason, setReason] = useState('')
  const [isRefunding, setIsRefunding] = useState(false)

  const refundableAmount = useMemo(() => billUser.paid_summary.final - billUser.refunds.total, [billUser])


  const createRefund = useCallback(() => {
    dispatch(doAlertAdd(`Refund ${firstAndL(billUser.name)} ${centsToDollar(amount)}?`, 'This can not be undone', [
      {
        text: `Yes, refund ${centsToDollar(amount)}`,
        onPress: async () => {
          try {
            setIsRefunding(true)
            const refundRef = restaurantRef.collection('Bills').doc(billUser.bill_id).collection('BillRefunds').doc()
            await refundRef.set({
              id: refundRef.id,
              bill_id: billUser.bill_id,
              user_id: billUser.id,
              restaurant_id: restaurantRef.id,
              amount_requested: amount,
              amount_refunded: 0,
              reason,
              timestamps: {
                created: firebase.firestore.FieldValue.serverTimestamp(),
                completed: null,
              },
              status: 'processing',
              existing_bill_payment_ids: billUser.analytics_helper.bill_payment_ids,
              bill_payment_ids: [],
              payment_intent_ids: [],
            })
          }
          catch (error) {
            console.log('CreateRefund error: ', error)
            dispatch(doAlertAdd('Refund failed', `Failed to refund ${firstAndL(billUser.name)} ${centsToDollar(amount)}. Please try again and let Torte support know if this issue persists.`))
          }
          finally {
            setIsRefunding(false)
          }
        }
      },
      {
        text: 'No, cancel',
      }
    ]))
  }, [amount, reason, billUser])


  return <View style={styles.user}>
    <View style={styles.userName}>
      <LargeText bold>{firstAndL(billUser.name)}</LargeText>
    </View>
    <View style={{ flexDirection: 'row', paddingVertical: 4 }}>
      <View>
        <LargeText>PAID: {centsToDollar(billUser.paid_summary.total)}</LargeText>
        {!!billUser.paid_summary.discounts && <DefaultText>Discounts are non-refundable</DefaultText>}
        <LargeText>TIPS: {centsToDollar(billUser.paid_summary.tips)}</LargeText>
        <LargeText>REFUNDED: {centsToDollar(-billUser.refunded.total)}</LargeText>
        <LargeText bold red>REFUNDABLE: {centsToDollar(refundableAmount)}</LargeText>
      </View>
      <View style={{ flex: 1, marginLeft: 30 }}>
        {
          Object.keys(billRefunds).length ?
            Object.keys(billRefunds).map(bill_refund_id => <Refund key={bill_refund_id} refund={billRefunds[bill_refund_id]} />) :
            <LargeText center>No prior refunds for this user</LargeText>
        }
      </View>
    </View>

    {/* FUTURE LINE ITEMS */}

    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 10, marginHorizontal: Layout.marHor }}>
      <View style={{ flex: 1 }}>
        <PortalTextField
          text='Amount'
          value={amount}
          onChangeText={setAmount}
          isNumber
          isRequired
          format={centsToDollar}
        />
        <PortalTextField
          text='Reason'
          value={reason}
          onChangeText={setReason}
          placeholder='(optional)'
        />
      </View>
      <StyledButton disabled={!amount || amount > refundableAmount} text={amount > refundableAmount ? `Max ${centsToDollar(refundableAmount)}` : amount ? `Refund ${centsToDollar(amount)}` : 'Missing amount'} onPress={createRefund} />
    </View>

    {isRefunding && <IndicatorOverlay text='Initiating refund' />}
  </View>
}

const Refund = ({ refund: { amount_requested, amount_refunded, status, is_failed, timestamps: { created } } }) => {
  if (!created) return null
  const date = created?.toDate()
  const isSucceeded = status === 'succeeded'
  const isFailed = status === 'failed'
  return <View>
    <LargeText center>({months[date.getMonth()]} {date.getDate()}) {centsToDollar(amount_refunded || amount_requested)} <Text style={{ fontWeight: isSucceeded || isFailed ? 'bold' : 'normal', color: isSucceeded ? Colors.green : isFailed ? Colors.red : Colors.white }}>({isFailed ? 'FAILED' : isSucceeded ? amount_requested === amount_refunded ? 'SUCCESS' : 'PARTIAL' : 'PENDING'})</Text></LargeText>
    {isSucceeded && amount_requested !== amount_refunded && <MediumText bold red center>FAILED TO REFUND {centsToDollar(amount_requested - amount_refunded)}</MediumText>}
  </View>
}


const styles = StyleSheet.create({
  user: {
    paddingVertical: 10,
    borderColor: Colors.white,
    borderBottomWidth: 1,
  },
  userName: {
    paddingBottom: 4,
    marginBottom: 4,
    borderColor: Colors.lightgrey,
    borderBottomWidth: 1,
  }
});

