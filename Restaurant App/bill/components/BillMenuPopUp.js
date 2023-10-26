import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { ExtraLargeText, } from '../../utils/components/NewStyledText';
import { useDispatch } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { transactVoidBill } from '../firestore/transactVoidBill';
import firebase from 'firebase';
import { useRestaurantRef } from '../../utils/hooks/useRestaurant';
import useBillNestedFields from '../../hooks/useBillNestedFields';
import centsToDollar from '../../utils/functions/centsToDollar';
import useRestaurantNestedFields from '../../hooks/useRestaurantNestedField';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { useNavigation } from '@react-navigation/native';



export const BillMenuPopUp = ({ bill_id, setShowBillMenu, setShowReprint, setShowBillPayments, closeBill, setShowComps, }) => {
  const restaurantRef = useRestaurantRef()
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const closePopUp = useCallback(() => {
    setShowBillMenu(false)
    setShowBillPayments(false)
    setShowReprint(false)
  }, [])

  const isBillDeleted = useBillNestedFields(bill_id, 'is_deleted')
  const paidTotal = useBillNestedFields(bill_id, 'paid_summary', 'total')
  const orderTotal = useBillNestedFields(bill_id, 'order_summary', 'total')
  const isOrderEnabledRestaurant = useRestaurantNestedFields('is_order_enabled',)
  const isPayEnabledRestaurant = useRestaurantNestedFields('is_pay_enabled',)
  const isOrderEnabledBill = useBillNestedFields(bill_id, 'is_order_enabled',)
  const isPayEnabledBill = useBillNestedFields(bill_id, 'is_pay_enabled',)
  const [savingOrderEnabled, setSavingOrderEnabled] = useState(false)
  const [savingPayEnabled, setSavingPayEnabled] = useState(false)


  const voidEntireBill = useCallback(() => {
    dispatch(doAlertAdd(
      isBillDeleted ? 'Unvoid bill' : paidTotal ? 'Void remainder?' : 'Void entire bill?',
      isBillDeleted ? 'This will reopen the bill for users' : 'This will close the bill and prevent further changes.', [
      // dispatch(doAlertAdd(isBillDeleted ? 'Unvoid bill' : 'Void entire bill?',isBillDeleted ? 'This will reopen the bill for users' : 'This will close the bill and prevent further changes.', [
      {
        text: isBillDeleted ? 'Yes, unvoid bill' : paidTotal ? 'Yes, void remainder' : 'Yes, void entire bill',
        // text: isBillDeleted ? 'Yes, unvoid bill' : 'Yes, void entire bill',
        onPress: async () => {
          try {
            const response = await transactVoidBill(restaurantRef, bill_id, !isBillDeleted)
            // Return to dashboard if unvoiding
            if (isBillDeleted) navigation.navigate('Dashboard')
            else {
              const { comp, isWithUsers } = response
              if (comp) dispatch(doAlertAdd(`Unable to void ${centsToDollar(comp.subtotal)}`, 'These items were partially paid. Do you want to comp this remainder?', [
                {
                  text: `Yes, comp ${centsToDollar(comp.subtotal)}`,
                  onPress: async () => {
                    try {
                      const { isWithUsers: iwu } = await transactVoidBill(restaurantRef, bill_id, true, comp,)
                      if (iwu) firebase.functions().httpsCallable('close-deleteOpenBillAlerts')({ bill_id })
                      closeBill()
                    }
                    catch (error) {
                      console.log('BillMenuPopUp voidEntireBill comp error: ', error)
                      dispatch(doAlertAdd('Failed to comp rest of bill', 'Please try again and let us know if the issue persists'))
                    }
                  }
                },
                {
                  text: 'No, I need to make other changes'
                }
              ]))
              else {
                if (isWithUsers) firebase.functions().httpsCallable('close-deleteOpenBillAlerts')({ bill_id })
                closeBill()
              }
            }
          }
          catch (error) {
            console.log('BillMenuPopUp voidEntireBill error: ', error)
            dispatch(doAlertAdd('Failed to void bill', 'Please try again and let us know if the issue persists'))
          }
        }
      },
      {
        text: 'No, cancel'
      }
    ]))
  }, [bill_id, paidTotal, isBillDeleted])

  const togglePermissions = (field, boolean) => {
    dispatch(doAlertAdd(`Turn ${boolean ? 'ON' : 'OFF'} ${field}ing for guests?`, undefined, [
      {
        text: 'Yes',
        onPress: async () => {
          try {
            if (field === 'order') setSavingOrderEnabled(true)
            else setSavingPayEnabled(true)

            await restaurantRef.collection('Bills').doc(bill_id).update({ [field === 'order' ? 'is_order_enabled' : 'is_pay_enabled']: boolean })
          }
          catch (error) {
            dispatch(doAlertAdd(`Unable to change ${field}`, 'Please try again and let Torte know if the issue persists'))
          }
          finally {
            if (field === 'order') setSavingOrderEnabled(false)
            else setSavingPayEnabled(false)
          }
        }
      },
      {
        text: 'No, cancel',
      }
    ]))
  }

  return <TouchableWithoutFeedback onPress={() => setShowBillMenu(false)}>
    <View style={{ position: 'absolute', justifyContent: 'center', alignItems: 'center', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: Colors.black + 'AA' }}>
      <View style={{ backgroundColor: Colors.darkgrey, }}>
        <TouchableOpacity style={styles.billMenuOption} onPress={() => {
          closePopUp()
        }}>
          <ExtraLargeText center>BILL HOME</ExtraLargeText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.billMenuOption} onPress={() => {
          closePopUp()
          setShowReprint(true)
        }}>
          <ExtraLargeText center>RESEND ITEMS</ExtraLargeText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.billMenuOption} onPress={() => {
          closePopUp()
          setShowComps(true)
        }}>
          <ExtraLargeText center>COMP BILL / ITEMS</ExtraLargeText>
        </TouchableOpacity>

        <TouchableOpacity disabled={orderTotal <= paidTotal && !isBillDeleted} style={[styles.billMenuOption, orderTotal <= paidTotal && !isBillDeleted && { opacity: 0.5 }]} onPress={voidEntireBill}>
          {/* <ExtraLargeText center>{paidTotal ? 'CANNOT VOID BILL' : isBillDeleted ? 'UNVOID BILL' : 'VOID ENTIRE BILL'}</ExtraLargeText> */}
          <ExtraLargeText center>{isBillDeleted ? 'UNVOID BILL' : paidTotal ? `VOID REMAINING ${centsToDollar(orderTotal - paidTotal)}` : 'VOID ENTIRE BILL'}</ExtraLargeText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.billMenuOption} onPress={() => {
          closePopUp()
          setShowBillPayments('refunds')
        }}>
          <ExtraLargeText center>REFUNDS</ExtraLargeText>
        </TouchableOpacity>

        <TouchableOpacity disabled={savingOrderEnabled || !isOrderEnabledRestaurant} style={[styles.billMenuOption, isOrderEnabledRestaurant && !isOrderEnabledBill && { backgroundColor: Colors.red }]} onPress={() => {
          togglePermissions('order', !isOrderEnabledBill)
        }}>
          {
            isOrderEnabledRestaurant ?
              <ExtraLargeText center>{isOrderEnabledBill ? 'GUEST ORDER ON' : 'GUEST ORDER OFF'}</ExtraLargeText> :
              <ExtraLargeText center>RESTAURANT ORDER DISABLED</ExtraLargeText>
          }
          {savingOrderEnabled && <IndicatorOverlay />}
        </TouchableOpacity>

        <TouchableOpacity disabled={savingPayEnabled || !isPayEnabledRestaurant} style={[styles.billMenuOption, isPayEnabledRestaurant && !isPayEnabledBill && { backgroundColor: Colors.red }]} onPress={() => {
          togglePermissions('pay', !isPayEnabledBill)
        }}>
          {
            isPayEnabledRestaurant ?
              <ExtraLargeText center>{isPayEnabledBill ? 'GUEST PAY ON' : 'GUEST PAY OFF'}</ExtraLargeText> :
              <ExtraLargeText center>RESTAURANT PAY DISABLED</ExtraLargeText>
          }
          {savingPayEnabled && <IndicatorOverlay />}
        </TouchableOpacity>


      </View>
    </View>
  </TouchableWithoutFeedback>
}



const styles = StyleSheet.create({
  billMenuOption: {
    paddingVertical: 24,
    paddingHorizontal: 40,
    borderColor: Colors.lightgrey,
    borderBottomWidth: StyleSheet.hairlineWidth,
  }
});

