import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { selectCurrentBillOrderID, selectIsOrderOccupied, selectIsOrderWithUser, selectOrderAutoPausedMillis, selectOrderPausedUserID, selectOrderPausedUserName, selectOrderReadyMillis, selectOrderWaitUserIDs, selectOrderWaitUserNamesString } from '../../redux/selectors/selectorsBillOrders';
import { MediumText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useBillID, useRestaurantID } from '../../utils/hooks/useBill';
import functions from '@react-native-firebase/functions'
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { useIsRestaurantOffline } from '../../utils/hooks/useRestaurant';
import { selectIsUserOnlyWithOrder } from '../../redux/selectors/selectorsBill';
import { useIsMyAccountAdmin, useMyID } from '../../utils/hooks/useUser';
import { transactForceBillOrder } from '../../menu/transactions/transactBillOrder';

export default function OrderForce({ isOrderStuck, isOrderAutoPaused }) {
  const dispatch = useDispatch()
  const myID = useMyID()
  const isAdmin = useIsMyAccountAdmin()

  const restaurant_id = useRestaurantID()
  const isRestaurantOffline = useIsRestaurantOffline()
  const bill_id = useBillID()
  const bill_order_id = useSelector(selectCurrentBillOrderID)

  const isOrderOccupied = useSelector(selectIsOrderOccupied)
  const orderReadyMillis = useSelector(selectOrderReadyMillis)
  const orderAutoPausedMillis = useSelector(selectOrderAutoPausedMillis)
  const orderPausedUserName = useSelector(selectOrderPausedUserName)
  const orderPausedUserID = useSelector(selectOrderPausedUserID)
  const orderWaitUserNames = useSelector(selectOrderWaitUserNamesString)
  const isOrderWithUser = useSelector(selectIsOrderWithUser)
  const isUserOnlyWithOrder = useSelector(selectIsUserOnlyWithOrder)

  const [isResendingOrder, setIsResendingOrder] = useState(false)
  const [isForcingOrder, setIsForcingOrder] = useState(false)

  const sendOrder = useCallback(async () => {
    try {
      setIsResendingOrder(true)
      await functions().httpsCallable('order2-itemize')({
        restaurant_id,
        bill_id,
        bill_order_id,
      })
    }
    catch (error) {
      console.log('itemize error: ', error)
      dispatch(doAlertAdd('Error sending order', error.message))
    }
    finally {
      setIsResendingOrder(false)
    }
  }, [restaurant_id, bill_id, bill_order_id])

  const forceSend = useCallback(() => {
    let subtext = []
    if (orderPausedUserName) subtext.push(`${orderPausedUserName} asked to pause these orders.`)
    if (orderWaitUserNames) subtext.push(`${orderWaitUserNames} asked to wait for them.`)
    if (!subtext.length && orderAutoPausedMillis) subtext.push("We automatically paused this order so everyone's food is prepared at the same time.")
    subtext.push('You can always send one or more of your items separately.')
    dispatch(doAlertAdd(
      `Ignore requests to wait and send ${isUserOnlyWithOrder ? 'your order' : "EVERYONE'S orders"}?`,
      subtext,
      [
        {
          text: `Yes, send ${isUserOnlyWithOrder ? 'my order' : "EVERYONE'S orders"}`,
          onPress: async () => {
            try {
              setIsForcingOrder(true)
              await transactForceBillOrder(restaurant_id, bill_id)
            }
            catch (error) {
              console.log('force send error: ', error)
              dispatch(doAlertAdd('Unable to send order', 'Your request may have come too late, or you may just need to try again.'))
            }
            finally {
              setIsForcingOrder(false)
            }
          }
        },
        {
          text: 'No, cancel.'
        }
      ]
    ))
  }, [restaurant_id, bill_id, orderPausedUserName, orderWaitUserNames, orderAutoPausedMillis, isUserOnlyWithOrder])

  if (!isOrderOccupied) return null

  return <View>
    {isOrderStuck ? <TouchableOpacity disabled={isResendingOrder} onPress={sendOrder}>
      <View style={[styles.button, { backgroundColor: Colors.white, }]}>
        <MediumText center red bold>{isResendingOrder ? isRestaurantOffline ? 'Forcing through...' : 'Resending...' : isRestaurantOffline ? 'FORCE ORDER(S)' : 'RESEND ALL ORDERS'}</MediumText>
      </View>
    </TouchableOpacity> :
      (isOrderWithUser && !orderReadyMillis && orderPausedUserID !== myID && !!(orderPausedUserID || orderWaitUserNames || isOrderAutoPaused)) ? <TouchableOpacity onPress={forceSend}>
        <View style={[styles.button, { backgroundColor: Colors.darkgrey, }]}>
          <MediumText center bold>{isForcingOrder ? 'Sending...' : 'FORCE ALL ORDERS'}</MediumText>
        </View>
      </TouchableOpacity> :
        (!orderReadyMillis && isOrderWithUser && isAdmin && orderPausedUserID !== myID) && <TouchableOpacity onPress={sendOrder}>
          <View style={[styles.button, { backgroundColor: Colors.darkgrey, }]}>
            <MediumText center bold>{isResendingOrder ? 'Sending...' : 'DEMO ONLY SEND'}</MediumText>
          </View>
        </TouchableOpacity>}
  </View>
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    paddingVertical: 8,
    marginTop: 8,
  }
});