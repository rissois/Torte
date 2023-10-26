import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { LargeText, MediumText, } from '../../utils/components/NewStyledText';
import { FlatList } from 'react-native-gesture-handler';
import centsToDollar from '../../utils/functions/centsToDollar';
import useBillNestedFields from '../../hooks/useBillNestedFields';
import Layout from '../../utils/constants/Layout';
import StyledButton from '../../utils/components/StyledButton';
import PortalSegment from '../../portal/components/PortalSegment';
import { RowSelectable } from '../../portal/components/PortalRow';
import { firstAndL } from '../../utils/functions/names';
import { useBillItemsByUser } from '../../utils/hooks/useBillItem';
import plurarize from '../../utils/functions/plurarize';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { useDispatch } from 'react-redux';
import { doPrintBill, doPrintReceipts } from '../../redux/actions/actionsPrint';

export default function BillPrint({ bill_id, setShowPrint }) {
  const dispatch = useDispatch()
  const restaurantRef = useRestaurantRef()
  const [type, setType] = useState('bills')
  const [selectedUserBills, setSelectedUserBills] = useState([])
  const [selectedPayments, setSelectedPayments] = useState({})
  const [isTablePrint, setIsTablePrint] = useState(true)
  const [isServerPrint, setIsServerPrint] = useState(false)

  const userNames = useBillNestedFields(bill_id, 'user_status')
  const { server, ...userOrderSummaries } = useBillItemsByUser(bill_id)
  const [payments, setPayments] = useState({})
  const [isLoadingPayments, setIsLoadingPayments] = useState(true)


  const isReceipts = type === 'receipts'

  useEffect(() => {
    // You can delay this until first receipts pressed
    // But receipts unlikely until after bill printed
    // So better UX to get immediately

    const paymentListener = restaurantRef.collection('Bills').doc(bill_id)
      .collection('BillPayments').where('status', '==', 'succeeded').onSnapshot(querySnapshot => {
        let changes = {}
        querySnapshot.docChanges().forEach(change => {
          if (change.type === "added" || change.type === "modified") {
            changes[change.doc.id] = change.doc.data()
          }
        });
        setPayments(prev => ({ ...prev, ...changes }))
        setIsLoadingPayments(false)
      })

    return () => {
      paymentListener()
    }
  }, [])

  const renderPayment = useCallback(({ item: bill_payment_id }) => {
    const { type, user_id, summary: { subtotal } } = payments[bill_payment_id]

    let name

    if (type === 'app' || type === 'free') name = firstAndL(userNames[user_id]?.name)
    else if (type === 'app' || type === 'charge' || type === 'free') name = firstAndL(userNames[user_id]?.name) + ` (charge)`
    else name = `(${type})`

    return <RowSelectable name={name} internal_name={centsToDollar(subtotal)} isSelected={selectedPayments.hasOwnProperty(bill_payment_id)} setSelected={() => setSelectedPayments(prev => {
      if (prev.hasOwnProperty(bill_payment_id)) {
        const { [bill_payment_id]: discard, ...rest } = prev
        return rest
      }
      return { ...prev, [bill_payment_id]: payments[bill_payment_id] }
    })} />

  }, [payments, selectedPayments, userNames])

  return <TouchableWithoutFeedback onPress={() => setShowPrint(false)}>
    <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: Colors.black + 'AA', padding: Layout.marHor * 2 }}>
      <TouchableWithoutFeedback>
        <View style={{ backgroundColor: Colors.background, flex: 1, minWidth: Layout.window.width * 0.7, paddingHorizontal: Layout.marHor }}>
          <View style={{ paddingVertical: 20, }}>
            <PortalSegment segments={['bills', 'receipts']} values={['Print bills', 'Print receipts']} segment={type} setSegment={setType} />
          </View>

          <TouchableOpacity style={{ paddingVertical: 8, paddingHorizontal: 20 }} onPress={() => {
            if (type === 'bills') {
              setIsTablePrint(true)
              setSelectedUserBills(Object.keys(userOrderSummaries))
              setIsServerPrint(true)
            }
            else {
              setSelectedPayments(payments)
            }
          }}>
            <MediumText center>Select All</MediumText>
          </TouchableOpacity>

          <View style={{ flex: 1 }}>
            {
              isReceipts ?
                <FlatList
                  style={{ paddingTop: 10, paddingBottom: Layout.scrollViewPadBot }}
                  data={Object.keys(payments)}
                  keyExtractor={item => item}
                  ListEmptyComponent={() => <LargeText center style={{ paddingVertical: 20 }}>No payments</LargeText>}
                  renderItem={renderPayment}
                />
                :
                <FlatList
                  style={{ paddingTop: 10, paddingBottom: Layout.scrollViewPadBot }}
                  data={Object.keys(userOrderSummaries ?? {})}
                  keyExtractor={item => item}
                  renderItem={({ item: user_id }) => <RowSelectable name={firstAndL(userNames[user_id]?.name)} internal_name={`${plurarize(userOrderSummaries[user_id].items, 'item', 'items')}; ${centsToDollar(userOrderSummaries[user_id].subtotal)}`} isSelected={selectedUserBills.includes(user_id)} setSelected={() => setSelectedUserBills(prev => prev.includes(user_id) ? prev.filter(id => id !== user_id) : [...prev, user_id])} />}
                  ListHeaderComponent={() => <RowSelectable name='Entire bill' isSelected={isTablePrint} setSelected={() => setIsTablePrint(prev => !prev)} />}
                  ListFooterComponent={() => !Object.keys(userOrderSummaries).length ?
                    <LargeText center style={{ paddingVertical: 20 }}>No other bills</LargeText> :
                    server ? <RowSelectable name='Server-added' internal_name={`${plurarize(server.items, 'item', 'items')}; ${centsToDollar(server.subtotal)}`} isSelected={isServerPrint} setSelected={() => setIsServerPrint(prev => !prev)} />
                      : null
                  }
                />
            }
            {isReceipts && isLoadingPayments && <IndicatorOverlay text='Loading payments' />}
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', paddingVertical: 20 }}>
            <StyledButton text='Cancel' onPress={() => setShowPrint(false)} color={Colors.red} />
            <StyledButton disabled={(!isReceipts && !selectedUserBills.length && !isTablePrint && !isServerPrint) || (isReceipts && !Object.keys(selectedPayments).length)} text={`PRINT ${isReceipts ? 'RECEIPTS' : 'BILLS'}`}
              onPress={() => {
                if (isReceipts) {
                  dispatch(doPrintReceipts(bill_id, selectedPayments, true, true))
                }
                else {
                  dispatch(doPrintBill(bill_id, isTablePrint, [...selectedUserBills, ...isServerPrint ? ['server'] : []]))
                }
                // isReceipt requires passing in each payment 
                // bill is already planned I think...
              }}
            />
          </View>

        </View>
      </TouchableWithoutFeedback>
    </View>
  </TouchableWithoutFeedback>
}

const styles = StyleSheet.create({
});

