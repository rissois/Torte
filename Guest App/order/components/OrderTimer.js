import React, { useEffect, useState, } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { useSelector } from 'react-redux';
import { selectOrderAutoPausedMillis, selectOrderPausedUserID, selectOrderReadyMillis, selectOrderWaitUserNamesString } from '../../redux/selectors/selectorsBillOrders';
import { MediumText, DefaultText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import { getNameOfUser } from '../../utils/functions/names';
import { useBillUserNames } from '../../utils/hooks/useBillUsers';
import OrderClock from './OrderClock';
import { useMyID } from '../../utils/hooks/useUser';
import { useIsRestaurantOffline } from '../../utils/hooks/useRestaurant';
import OrderForce from './OrderForce';

const DELAY_25_SECONDS = 25000
const PAUSE_2_MINUTES = 120000

export default function OrderTimer({ }) {
  const myID = useMyID()
  const isRestaurantOffline = useIsRestaurantOffline()

  const orderReadyMillis = useSelector(selectOrderReadyMillis)
  const orderAutoPausedMillis = useSelector(selectOrderAutoPausedMillis)
  const orderPausedUserID = useSelector(selectOrderPausedUserID)
  const orderWaitUserNames = useSelector(selectOrderWaitUserNamesString)
  const billUserNames = useBillUserNames()

  const [isOrderStuck, setIsOrderStuck] = useState(false)
  const [isOrderAutoPaused, setIsOrderAutoPaused] = useState(false)


  useEffect(() => {
    if (orderReadyMillis) {
      const timeout = setTimeout(() => {
        setIsOrderStuck(true)
      }, orderReadyMillis + DELAY_25_SECONDS - Date.now())

      return () => clearTimeout(timeout)
    }
    setIsOrderStuck(false)
  }, [orderReadyMillis])

  useEffect(() => {
    if (orderAutoPausedMillis) {
      setIsOrderAutoPaused(true)
      const timeout = setTimeout(() => {
        setIsOrderAutoPaused(false)
      }, orderAutoPausedMillis + PAUSE_2_MINUTES - Date.now())

      return () => clearTimeout(timeout)
    }
    setIsOrderAutoPaused(false)
  }, [orderAutoPausedMillis])

  return <View style={[styles.timerContainer, {
    ...orderReadyMillis ? { backgroundColor: Colors.red, borderColor: Colors.red } : orderPausedUserID || orderWaitUserNames || isOrderAutoPaused ? { backgroundColor: Colors.paper, borderColor: Colors.paper } : { borderColor: Colors.white }
  }]}>
    <View style={{ flexDirection: 'row', alignItems: 'center', }}>
      <OrderClock
        isOrderStuck={isOrderStuck}
        setIsOrderStuck={setIsOrderStuck}
      />
      <View style={{ marginLeft: 8, flex: 1, }}>
        {
          isOrderStuck ?
            isRestaurantOffline ?
              <View>
                <MediumText bold>The restaurant is offline</MediumText>
                <DefaultText>Ask a staff member</DefaultText>
                <DefaultText>before forcing an order</DefaultText>
              </View> :
              <View>
                <MediumText bold>This is taking longer than it should</MediumText>
                <DefaultText>Press below to try to resend</DefaultText>
              </View> :
            orderReadyMillis ?
              <View>
                <MediumText bold >Sending order to server</MediumText>
                <DefaultText >You can pause or cancel the order below.</DefaultText>
              </View> :
              orderPausedUserID ?
                <View>
                  <MediumText bold darkgrey>Order paused</MediumText>
                  <DefaultText darkgrey>{myID === orderPausedUserID ? 'You have paused this order' : `Requested by ${getNameOfUser(orderPausedUserID, billUserNames, true)}`}</DefaultText>
                  {!!orderWaitUserNames && <DefaultText darkgrey>Also waiting for {orderWaitUserNames}</DefaultText>}
                </View> :
                orderWaitUserNames ?
                  <View>
                    <MediumText bold darkgrey>Waiting for others</MediumText>
                    <DefaultText darkgrey>Requested by {orderWaitUserNames}.</DefaultText>
                  </View> :
                  orderAutoPausedMillis ?
                    <View>
                      <MediumText bold darkgrey>Order automatically paused</MediumText>
                      <DefaultText darkgrey>Waiting to ensure guests order at the same time</DefaultText>
                    </View> :
                    <View>
                      <MediumText bold >No pending order</MediumText>
                      <DefaultText>You can view the menu or pay your bill below.</DefaultText>
                    </View>
        }
      </View>
    </View>
    <OrderForce isOrderStuck={isOrderStuck} isOrderAutoPaused={isOrderAutoPaused} />
  </View>
}

/*
(isOrderWithUser && !orderReadyMillis && !orderPausedUserID && !orderWaitUserNames && orderAutoPausedMillis) && <TouchableOpacity onPress={pauseOrder}>
        <View style={{ backgroundColor: Colors.darkgrey, borderRadius: 20, paddingVertical: 8, marginTop: 12 }}>
          <MediumText center bold>{isForcingOrder ? 'Extending...' : 'EXTEND PAUSE'}</MediumText>
        </View>
      </TouchableOpacity>

      const pauseOrder = useCallback(async () => {
    try {
      setIsForcingOrder(true)
      await transactPauseBillOrderToggle(restaurant_id, bill_id, true)
      dispatch(doAlertAdd('Order is paused', 'This order is paused until you unpause it or someone forces the order through'))
    }
    catch (error) {
      console.log('toggle pause error: ', error)
      dispatch(doAlertAdd('Unable to pause order', 'Your request may have come too late. Please talk to your server if you need to change the order.'))
    }
    finally {
      setIsForcingOrder(false)
    }
  }, [restaurant_id, bill_id,])
*/



const styles = StyleSheet.create({
  timerContainer: {
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderWidth: 1,
  }
});