import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  UIManager,
  LayoutAnimation,
  FlatList,
} from 'react-native';
import Layout from '../../utils/constants/Layout';
import firebase from 'firebase';
import { DefaultText, ExtraLargeText, LargeText, MediumText, SuperLargeText, } from '../../utils/components/NewStyledText';
import Header from '../../utils/components/Header';
import { useDispatch, } from 'react-redux';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import { dateToClock, } from '../../functions/dateAndTime';
import Colors from '../../utils/constants/Colors';
import StyledButton from '../../utils/components/StyledButton';
import centsToDollar from '../../utils/functions/centsToDollar';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { PortalDropdownField, PortalTextField } from '../../portal/components/PortalFields';
import capitalize from '../../utils/functions/capitalize';
import useBillNestedFields from '../../hooks/useBillNestedFields';
import { transactCashPayment } from '../firestore/transactCashPayment';
import { firstAndL } from '../../utils/functions/names';
import { doPrintReceipts, doPrintRefunds } from '../../redux/actions/actionsPrint';

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const POS_PAYMENT_TYPES = ['swipe', 'manual', 'cash',] // 'outside'
const REFUNDABLE_PAYMENT_TYPES = ['swipe', 'manual', 'app', 'charge']

export default function BillPayments({ showBillPayments, setShowBillPayments, bill_id, tableName, billCode, isRefundOnly }) {
  const restaurantRef = useRestaurantRef()

  const [isOpen, setIsOpen] = useState(false)
  const [isLoadingPayments, setIsLoadingPayments] = useState(true)
  const [payments, setPayments] = useState({})
  const [refunds, setRefunds] = useState({})

  const [refundPaymentID, setRefundPaymentID] = useState('')


  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsOpen(true)
  }, [showBillPayments])

  const animateClose = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut, () => setShowBillPayments(false));
    setIsOpen(false)
  }, [])

  useEffect(() => {
    // You can delay this until first receipts pressed
    // But receipts unlikely until after bill printed
    // So better UX to get immediately

    const paymentListener = restaurantRef?.collection('Bills')?.doc(bill_id)
      .collection('BillPayments').onSnapshot(querySnapshot => {
        let changes = {}
        querySnapshot.docChanges().forEach(change => {
          if (change.type === "added" || change.type === "modified") {
            changes[change.doc.id] = change.doc.data()
          }
        });
        setPayments(prev => ({ ...prev, ...changes }))
        setIsLoadingPayments(false)
      })

    const refundListener = restaurantRef?.collection('Bills')?.doc(bill_id)
      .collection('BillRefunds').onSnapshot(querySnapshot => {
        let changes = {}
        querySnapshot.docChanges().forEach(change => {
          if (change.type === "added" || change.type === "modified") {
            changes[change.doc.id] = change.doc.data()
          }
        });
        setRefunds(prev => {
          let copy = { ...prev }
          Object.keys(changes).forEach(bill_refund_id => {
            const bill_payment_id = changes[bill_refund_id].bill_payment_id
            if (!copy[bill_payment_id]) copy[bill_payment_id] = { [bill_refund_id]: changes[bill_refund_id] }
            // Cannot do direct assignment, need new reference to trigger other renders
            else copy[bill_payment_id] = { ...copy[bill_payment_id], [bill_refund_id]: changes[bill_refund_id] }
          })
          return copy
        })
      })

    return () => {
      paymentListener()
      refundListener()
    }

  }, [])

  const sortedPaymentIDs = useMemo(() => {
    return Object.keys(payments).sort((a, b) => {
      return payments[b].timestamps.created.toMillis() - payments[a].timestamps.created.toMillis()
    })
  }, [payments])

  return <View style={[styles.container, StyleSheet.absoluteFill, { top: isOpen ? 0 : '100%' }]}>
    <Header backFn={() => {
      animateClose()
    }}>
      <LargeText center>{tableName} - #{billCode}</LargeText>
    </Header>

    <FlatList
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={{ marginHorizontal: Layout.marHor, marginTop: 20, paddingBottom: Layout.scrollViewPadBot }}
      data={sortedPaymentIDs}
      extraData={refunds}
      keyExtractor={item => item}
      renderItem={({ item: bill_payment_id }) => <ExistingPayment bill_id={bill_id} payment={payments[bill_payment_id]} setRefundPaymentID={setRefundPaymentID} refunds={refunds[bill_payment_id]} />}
      ListHeaderComponent={() => <View>
        {!isRefundOnly && <NewPayment bill_id={bill_id} />}
        <View style={{ paddingVertical: 20, marginTop: 20, borderColor: Colors.white, borderTopWidth: 1, borderBottomWidth: 1 }}>
          <ExtraLargeText center>PRIOR PAYMENTS</ExtraLargeText>
        </View>
      </View>
      }
      ListFooterComponent={() => <View style={{ paddingVertical: 20 }}>
        {
          isLoadingPayments ? <IndicatorOverlay text='Loading payments' />
            : Object.keys(payments).length ? <DefaultText center>No further payments</DefaultText>
              : <DefaultText center>No payments yet</DefaultText>
        }
      </View>

      }
    />

    {!!refundPaymentID && <RefundPayment payment={payments[refundPaymentID]} setRefundPaymentID={setRefundPaymentID} />}

  </View>
}

const NewPayment = ({ bill_id, }) => {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()

  // const orderSubtotal = useBillNestedFields(bill_id, 'order_summary', 'subtotal')
  // const orderTax = useBillNestedFields(bill_id, 'order_summary', 'tax')
  const orderTotal = useBillNestedFields(bill_id, 'order_summary', 'total')
  // const paidSubtotal = useBillNestedFields(bill_id, 'paid_summary', 'subtotal')
  // const paidTax = useBillNestedFields(bill_id, 'paid_summary', 'tax')
  const paidTotal = useBillNestedFields(bill_id, 'paid_summary', 'total')

  const [type, setType] = useState('cash')
  const [amount, setAmount] = useState(0)
  const [tip, setTip] = useState(0)
  const [comment, setComment] = useState('')
  const [tendered, setTendered] = useState(0)
  const [isSaving, setIsSaving] = useState(false)

  const invalidTotal = (amount + tip) < ((type === 'swipe' || type === 'manual') ? 50 : 1)

  const savePayment = async () => {
    switch (type) {
      case 'swipe':
      case 'manual':
        break;
      case 'cash':
        try {
          setIsSaving(true)
          await transactCashPayment(restaurantRef, bill_id, amount, tip, comment, tendered)
          setAmount(0)
          setTendered(0)
          setTip(0)
          setComment('')
        }
        catch (error) {
          console.log('BillPayments NewPayment savePayment cash error: ', error)
          dispatch(doAlertAdd('Unable to save cash payment', 'Please try again and let Torte know if the issue persists'))
        }
        finally {
          setIsSaving(false)
        }
        // Simply write to bill payment
        break;
      case 'outside':
        // Simply write to bill payment
        break;
    }
  }

  return <View style={{ marginBottom: 20 }}>
    <TouchableOpacity onPress={() => setAmount(orderTotal - paidTotal)}>
      <ExtraLargeText bold red center>TOTAL UNPAID {centsToDollar(orderTotal - paidTotal)}</ExtraLargeText>
      <MediumText center style={{ marginBottom: 10 }}>(autofill {centsToDollar(orderTotal - paidTotal)})</MediumText>
    </TouchableOpacity>

    <View >
      <PortalDropdownField
        text='Type'
        value={type}
        options={POS_PAYMENT_TYPES}
        setValue={setType}
        format={capitalize}
        isRequired
      />

      <PortalTextField
        text='Total'
        value={amount}
        onChangeText={setAmount}
        isNumber
        format={centsToDollar}
      />

      <PortalTextField
        text='Tip'
        value={tip}
        onChangeText={setTip}
        isNumber
        format={centsToDollar}
      />

      <PortalTextField
        text='Comment'
        value={comment}
        onChangeText={setComment}
        placeholder='(recommended)'
      />

      {type === 'cash' && <View style={{ flexDirection: 'row', marginVertical: 10, paddingVertical: 4, borderColor: Colors.white, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'space-evenly' }}>
        <PortalTextField
          text='Tendered'
          subtext='(optional)'
          value={tendered}
          onChangeText={setTendered}
          isNumber
          format={centsToDollar}
        />

        <View style={{ marginLeft: 40 }}>
          <PortalTextField
            text='Change'
            value={tendered - amount - tip}
            format={centsToDollar}
            backgroundColor={Colors.background}
            isLocked
          />
        </View>
      </View>}

      <StyledButton style={{ marginVertical: 20 }} center disabled={invalidTotal} text={invalidTotal ? type === 'swipe' | type === 'manual' ? '50¢ minimum swipe' : 'Enter total and / or tip' : 'Save payment'} onPress={savePayment} />
      {isSaving && <IndicatorOverlay text='Saving...' />}
    </View>
  </View >

}

const RefundPayment = ({ setRefundPaymentID, payment: {
  id: bill_payment_id,
  summary: { total: paymentTotal, tip: paymentTip },
  refunds: { total: refundedTotal, tip: refundedTip },
  user: { id: user_id, name },
  bill_id,
  restaurant_id,
} }) => {
  const restaurantRef = useRestaurantRef()
  const dispatch = useDispatch()
  const [total, setTotal] = useState(0)
  const [tip, setTip] = useState(0)
  const [reason, setReason] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  // button to add a new payment

  const issueRefund = () => dispatch(doAlertAdd(`Refund ${firstAndL(name)} ${centsToDollar(total + tip)}?`, 'This can not be undone', [
    {
      text: `Yes, refund ${centsToDollar(total + tip)}`,
      onPress: async () => {
        try {
          setIsSaving(true)
          const refundRef = restaurantRef.collection('Bills').doc(bill_id).collection('BillRefunds').doc()
          await refundRef.set({
            id: refundRef.id,
            bill_id,
            user_id,
            restaurant_id,
            bill_payment_id,
            total,
            tip,
            reason,
            refund: null,
            timestamps: {
              created: firebase.firestore.FieldValue.serverTimestamp(),
              completed: null,
            },
            status: 'processing',
            payment_intent_id: '',
          })
          setIsSaving(false)
          setRefundPaymentID('')
        }
        catch (error) {
          setIsSaving(false)

          console.log('CreateRefund error: ', error)
          dispatch(doAlertAdd('Refund failed', `Failed to refund ${firstAndL(name)} ${centsToDollar(tip + total)}. Please try again and let Torte support know if this issue persists.`))
        }
      }
    },
    {
      text: 'No, cancel',
    }
  ]))

  return <View style={{ position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, justifyContent: 'center', backgroundColor: Colors.black + 'AA', zIndex: 99 }} >
    <View style={{ margin: Layout.marHor, padding: Layout.marHor, backgroundColor: Colors.background }}>
      <Header close backFn={() => setRefundPaymentID('')}>
        <ExtraLargeText bold center>REFUND PAYMENT</ExtraLargeText>
      </Header>
      {!!name && <LargeText center>{firstAndL(name)}</LargeText>}
      <LargeText center>TOTAL: {centsToDollar(paymentTotal)}   TIP: {centsToDollar(paymentTip)}</LargeText>
      {!!refundedTotal && <LargeText center>Already refunded: {centsToDollar(refundedTotal)} ({centsToDollar(refundedTip)} tip)</LargeText>}
      <ExtraLargeText bold red center style={{ marginVertical: 10 }}>REFUNDABLE: {centsToDollar(paymentTotal - refundedTotal)} ({centsToDollar(paymentTip - refundedTip)} tip)</ExtraLargeText>

      <View style={{ marginVertical: 40 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PortalTextField
            text='Amount'
            value={total}
            onChangeText={setTotal}
            isNumber
            format={centsToDollar}
            max={paymentTotal - refundedTotal}
          />
          <TouchableOpacity onPress={() => setTotal(paymentTotal - refundedTotal)}>
            <MediumText style={{ marginLeft: 20 }}>Refund {centsToDollar(paymentTotal - refundedTotal)}</MediumText>
          </TouchableOpacity>

        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <PortalTextField
            text='Refund tip'
            value={tip}
            onChangeText={setTip}
            isNumber
            format={centsToDollar}
            max={paymentTip - refundedTip}
          />

          <TouchableOpacity onPress={() => setTip(paymentTip - refundedTip)}>
            <MediumText style={{ marginLeft: 20 }}>Refund {centsToDollar(paymentTip - refundedTip)} tip</MediumText>
          </TouchableOpacity>
        </View>
        <PortalTextField
          text='Reason'
          value={reason}
          onChangeText={setReason}
          isRequired
          placeholder='(required)'
        />
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
        <StyledButton center color={Colors.red} text='Cancel refund' onPress={() => setRefundPaymentID('')} />
        <StyledButton center disabled={!total || !tip || !reason || total > paymentTotal - refundedTotal || tip > paymentTip - refundedTip} text={!(total || tip) ? 'Enter an amount' : total > paymentTotal - refundedTotal ? `Max ${centsToDollar(refundable)} total` : tip > paymentTip - refundedTip ? `Max ${centsToDollar(paymentTip - refundedTip)} tip` : !reason ? 'Enter a reason' : 'Issue refund'} onPress={issueRefund} />
      </View>
    </View >

    {isSaving && <IndicatorOverlay text="Saving..." />}
  </View>
}

const ExistingPayment = ({ payment, bill_id, setRefundPaymentID, refunds = {} }) => {
  const restaurantRef = useRestaurantRef()
  const dispatch = useDispatch()
  const [isDeleting, setIsDeleting] = useState(false)

  const deletePayment = useCallback(() => {
    dispatch(doAlertAdd('Delete payment?', undefined, [
      {
        text: 'Yes, delete payment',
        onPress: async () => {
          try {
            setIsDeleting(true)
            await restaurantRef.collection('Bills').doc(bill_id).collection('BillPayments').doc(payment.id).update({ is_deleted: true, status: 'processing' })
          }
          catch (error) {
            console.log('BillPayments ExistingPayment deletePayment error: ', error)
            dispatch(doAlertAdd('Unable to delete payment', 'Please try again and let Torte know if the issue persists'))
          }
          finally {
            setIsDeleting(false)
          }
        }
      },
      {
        text: 'No, cancel',
      }
    ]))
  }, [])

  const printPayment = useCallback(() => {
    dispatch(doAlertAdd('Print receipt?', undefined, [
      {
        text: 'Yes, signature required',
        onPress: () => dispatch(doPrintReceipts(bill_id, { [payment.id]: payment }, true, true))
      },
      {
        text: 'Yes, signature not required',
        onPress: () => dispatch(doPrintReceipts(bill_id, { [payment.id]: payment }, false, true))
      },
      {
        text: 'No, cancel',
      }
    ]))
  }, [payment])

  const printRefund = useCallback((bill_refund_id) => {
    dispatch(doAlertAdd('Print refund?', undefined, [
      {
        text: 'Yes, print',
        onPress: () => dispatch(doPrintRefunds(bill_id, { [bill_refund_id]: refunds[bill_refund_id] }, { [payment.id]: payment }, true))
      },
      {
        text: 'No, cancel',
      }
    ]))
  }, [payment, refunds])

  const sortedRefundIDs = useMemo(() => {
    return Object.keys(refunds).sort((a, b) => {
      if (!refunds[a].timestamps?.created?.toMillis()) return -1
      if (!refunds[b].timestamps?.created?.toMillis()) return -1
      return refunds[b].timestamps.created.toMillis() - refunds[a].timestamps.created.toMillis()
    })
  }, [refunds])

  const isRefundable = useMemo(() => {
    return REFUNDABLE_PAYMENT_TYPES.includes(payment.type)
  }, [])

  const refunded = payment.refunds.total + payment.refunds.tip
  const isFullyRefunded = payment.summary.total + payment.summary.tip - refunded <= 0

  if (payment.is_deleted && payment.status !== 'processing') return null
  return <TouchableOpacity disabled={true || isDeleting || !isRefundable} >
    <View style={{ paddingHorizontal: 20, paddingVertical: 10, borderColor: Colors.lightgrey, borderBottomWidth: StyleSheet.hairlineWidth, }}>
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 1 }}>
          <LargeText>{payment.type.toUpperCase()}{payment.user_id ? ` (by ${firstAndL(payment.user.name)})` : ''}</LargeText>
          <LargeText bold style={{ color: payment.status === 'succeeded' ? Colors.green : payment.status === 'failed' || payment.is_deleted ? Colors.red : Colors.lightgrey }}>{payment.status.toUpperCase()}</LargeText>
          {/* <LargeText>{dateToClock(payment.timestamps.created.toDate())}</LargeText> */}
        </View>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <View>
            <LargeText>Total: {centsToDollar(payment.summary.total)}</LargeText>
            <LargeText>Tip: {centsToDollar(payment.summary.tip)}</LargeText>
            {!!refunded && <LargeText red bold>Refunds: {centsToDollar(refunded)}</LargeText>}
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity disabled={isRefundable && isFullyRefunded} onPress={isRefundable ? () => setRefundPaymentID(prev => prev === payment.id ? '' : payment.id) : deletePayment}>
            <MaterialCommunityIcons
              name={isRefundable ? 'cash-refund' : 'delete-forever'} // SWAP OUT FOR REFUND
              size={32}
              color={isRefundable && isFullyRefunded ? Colors.darkgrey : Colors.red}
              style={{ paddingHorizontal: 15, }}
            />
          </TouchableOpacity>
          {/* disabled={payment.status !== 'succeeded'} */}
          <TouchableOpacity onPress={printPayment}>
            <MaterialIcons
              name='print'
              size={32}
              color={Colors.white}
              style={{ paddingHorizontal: 15 }}
            />
          </TouchableOpacity>

        </View>
      </View>
      {!!payment.comment && <MediumText style={{ paddingVertical: 4, paddingHorizontal: 20 }}>{payment.comment}</MediumText>}

      {
        sortedRefundIDs.map((bill_refund_id, index) => {
          const { status, timestamps: { created }, total, tip, reason } = refunds[bill_refund_id]
          return <View key={bill_refund_id} style={{ flexDirection: 'row', alignItems: 'center', }}>
            <View style={{ width: 30, backgroundColor: Colors.darkgrey, height: 30, marginHorizontal: 10, justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ height: 3, width: '44%', backgroundColor: Colors.white }} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, borderColor: Colors.white, borderBottomWidth: 1, }}>
              <View style={{ flex: 1, paddingHorizontal: 10, paddingVertical: 8 }}>
                <LargeText bold>REFUND  <LargeText style={{ color: status === 'succeeded' ? Colors.green : status === 'processing' ? Colors.lightgrey : Colors.red }}>{status.toUpperCase()}</LargeText> ({dateToClock(created?.toDate())})</LargeText>
                <View>
                  <LargeText>Total: {centsToDollar(total)}    Tip: {centsToDollar(tip)}</LargeText>
                </View>
                <MediumText >REASON: {reason}</MediumText>
              </View>
              <TouchableOpacity onPress={() => printRefund(bill_refund_id)}>
                <MaterialIcons
                  name='print'
                  size={32}
                  color={Colors.white}
                  style={{ paddingHorizontal: 15 }}
                />
              </TouchableOpacity>
            </View>
          </View>
        })
      }
    </View>

    {isDeleting && <IndicatorOverlay horizontal text='Deleting...' />}
  </TouchableOpacity>
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Layout.marHor,
    paddingVertical: 20,
    backgroundColor: Colors.background,
    overflow: 'hidden'
  }
});

