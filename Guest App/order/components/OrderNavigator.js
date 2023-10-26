import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  LayoutAnimation,
  TouchableOpacity,
} from 'react-native';
import { doRestaurantMenuStart } from '../../redux/actions/actionsRestaurants.web';
import { useFocusEffect, useNavigation, } from '@react-navigation/native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { MediumText, ExtraLargeText, LargeText, DefaultText, SuperLargeText } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import plurarize from '../../utils/functions/plurarize';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import centsToDollar from '../../utils/functions/centsToDollar';
import { transactPayAll } from '../../pay/firestore/transactPayAll';
import { selectIsListeningMenus, } from '../../redux/selectors/selectorsListeners';

import { selectBillRemainingSubtotal, selectIsBillPartiallyClaimed, selectIsBillPartiallyPaid, selectIsBillPayEnabled, selectIsBillStarted, selectIsBillUnpaid, selectIsUserOnlyWithOrder, selectIsUserPayingAll, selectIsUserWithPriorOrder, } from '../../redux/selectors/selectorsBill';
import { selectIsOrderForced, selectIsOrderOccupied, selectIsOrderPausedByMe, selectIsOrderReady, selectIsOrderWaiting, selectIsOrderWaitingForUser, selectIsOrderWithUser, selectOrderPausedUserName, } from '../../redux/selectors/selectorsBillOrders';
import { useBillID, useRestaurantID, } from '../../utils/hooks/useBill';
import { selectNumberOfItemsInCart } from '../../redux/selectors/selectorsBillGroups';
import { transactCancelBillOrder, transactPauseBillOrderToggle, transactWaitBillOrderToggle } from '../../menu/transactions/transactBillOrder';
import { firstAndL } from '../../utils/functions/names';
import { selectRestaurantIsPayEnabled } from '../../redux/selectors/selectorsRestaurant2';
import { selectMyClaimSubtotal } from '../../redux/selectors/selectorsBillUsers';

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const animationConfiguration = {
  duration: 250,
  create:
  {
    type: LayoutAnimation.Types.easeInEaseOut,
    property: LayoutAnimation.Properties.opacity,
  },
  update:
  {
    type: LayoutAnimation.Types.easeInEaseOut,
  }
}

export default function OrderNavigator({
  setIsProcessingPayAll,
  setNavigatorHeight,
  setAlteringBillOrder,
  isCancellingPayAll,
  isOrderEnabled
}) {
  const isOrderOccupied = useSelector(selectIsOrderOccupied)
  const isOrderWithUser = useSelector(selectIsOrderWithUser)

  const [isButtonPressDisabled, setIsButtonPressDisabled] = useState(false)
  const [isOrderOccupiedAnimated, setIsOrderOccupiedAnimated] = useState(isOrderOccupied)
  const [isUserInOrderAnimated, setIsUserInOrderAnimated] = useState(isOrderWithUser)

  useEffect(() => {
    /*
    * Generate smooth, blocking animations when 
    * order is started and/or user is a part of the order
    */
    setIsButtonPressDisabled(true)

    const timeout = setTimeout(() => {
      setIsButtonPressDisabled(false)
    }, 250)

    LayoutAnimation.configureNext(animationConfiguration)

    setIsOrderOccupiedAnimated(isOrderOccupied)
    setIsUserInOrderAnimated(isOrderWithUser)

    return () => clearTimeout(timeout)
  }, [isOrderWithUser, isOrderOccupied])

  return (
    <View
      style={isOrderEnabled ? styles.order : [styles.flex, styles.noOrder]}
      onLayout={({ nativeEvent }) => setNavigatorHeight(nativeEvent.layout.height)}
    >
      {isOrderEnabled && (
        <ManageOrderButton
          isUserInOrderAnimated={isUserInOrderAnimated}
          isButtonPressDisabled={isButtonPressDisabled}
          setAlteringBillOrder={setAlteringBillOrder}
          isOrderOccupiedAnimated={isOrderOccupiedAnimated}
        />
      )}
      <View style={[!isOrderEnabled && styles.row, !isOrderEnabled && styles.flex]}>
        <MenuButton
          isOrderEnabled={isOrderEnabled}
          isUserInOrderAnimated={isUserInOrderAnimated}
          isButtonPressDisabled={isButtonPressDisabled}
        />
        <ReceiptButton
          isOrderEnabled={isOrderEnabled}
          isButtonPressDisabled={isButtonPressDisabled}
        />
      </View>

      <PayButtons
        isOrderEnabled={isOrderEnabled}
        isUserInOrderAnimated={isUserInOrderAnimated}
        isButtonPressDisabled={isButtonPressDisabled}
        isCancellingPayAll={isCancellingPayAll}
        setIsProcessingPayAll={setIsProcessingPayAll}
      />
    </View>
  )
}

const ManageOrderButton = ({ isUserInOrderAnimated, isButtonPressDisabled, isOrderOccupiedAnimated, setAlteringBillOrder }) => {
  const restaurant_id = useRestaurantID()
  const bill_id = useBillID()
  const dispatch = useDispatch()

  const isUserOnlyWithOrder = useSelector(selectIsUserOnlyWithOrder)

  const isOrderReady = useSelector(selectIsOrderReady)
  const isOrderForced = useSelector(selectIsOrderForced)
  const orderPausedUserName = useSelector(selectOrderPausedUserName)
  const isOrderPausedByMe = useSelector(selectIsOrderPausedByMe)
  const isOrderWaiting = useSelector(selectIsOrderWaiting)
  const isOrderWaitingForUser = useSelector(selectIsOrderWaitingForUser)

  const isUserPayingAll = useSelector(selectIsUserPayingAll)

  const togglePause = useCallback(async () => {
    const isPausing = isOrderReady || !orderPausedUserName
    try {
      setAlteringBillOrder(isPausing ? 'Pausing order(s)' : 'Unpausing order(s)')
      await transactPauseBillOrderToggle(restaurant_id, bill_id, isPausing)
      if (isPausing) dispatch(doAlertAdd('Order is paused', 'This order is paused until you unpause it or someone forces the order through'))
    }
    catch (error) {
      console.log('toggle pause error: ', error)
      if (isPausing) {
        dispatch(doAlertAdd('Unable to pause order', 'Your request may have come too late. Please talk to your server if you need to change the order.'))
      }
      else {
        dispatch(doAlertAdd('Unable to unpause order', 'Please try again and let us know if the issue persists.'))
      }
    }
    finally {
      setAlteringBillOrder('')
    }
  }, [restaurant_id, bill_id, isOrderReady, orderPausedUserName, isOrderWaiting])

  const cancelOrder = useCallback(async () => {
    try {
      setAlteringBillOrder('Cancelling order...')
      const isHolding = await transactCancelBillOrder(restaurant_id, bill_id)
      if (isHolding) dispatch(doAlertAdd('We are holding this order for you', ['This order will wait for 5 minutes of inactivity before it is sent to the server', 'You can undo this wait if you want your friend(s) items to be prepared without yours.']))
    }
    catch (error) {
      console.log('cancel order error: ', error)
      dispatch(doAlertAdd('Unable to cancel your order', 'Please try again and let us know if the issue persists. Talk to your server if the order accidentally goes through.'))
    }
    finally {
      setAlteringBillOrder('')
    }
  }, [restaurant_id, bill_id])

  const waitOrder = useCallback(async () => {
    try {
      setAlteringBillOrder(isOrderWaitingForUser ? 'Undoing wait...' : 'Requesting wait...')
      await transactWaitBillOrderToggle(restaurant_id, bill_id, !isOrderWaitingForUser)
      if (!isOrderWaitingForUser) dispatch(doAlertAdd('We are holding this order for you', ['This order will wait for 5 minutes of inactivity before it is sent to the server', 'You can undo this wait if you want your friend(s) items to be prepared without yours.']))
    }
    catch (error) {
      console.log('wait order error: ', error)

      if (isOrderWaitingForUser) {
        dispatch(doAlertAdd('Unable to remove wait', 'Please try again and let us know if the issue persists. Talk to your server if the order accidentally goes through.'))
      }
      else {
        dispatch(doAlertAdd('Unable to wait', 'Your request may have come too late. Talk to your server if the order accidentally goes through.'))
      }
    }
    finally {
      setAlteringBillOrder('')
    }
  }, [restaurant_id, bill_id, isOrderWaitingForUser,])

  // User paying all should not be on this screen, cannot participate
  // if order is empty, nothing to show
  if (isUserPayingAll || !isOrderOccupiedAnimated) return null

  // if user is in order...
  if (isUserInOrderAnimated) return (
    <View>
      {
        isOrderReady ?
          <OrderButton
            text={isUserOnlyWithOrder ? 'Pause my order' : 'Pause all orders'}
            onPress={togglePause}
            disabled={isButtonPressDisabled}
            color={Colors.midgrey}
            fill
          /> :
          isOrderPausedByMe ?
            <OrderButton
              text={isUserOnlyWithOrder ? 'Unpause my order' : 'Unpause all orders'}
              onPress={togglePause}
              disabled={isButtonPressDisabled}
              color={Colors.midgrey}
              fill
            /> :
            orderPausedUserName ?
              <OrderButton
                text={`Order paused by ${firstAndL(orderPausedUserName)}`}
                disabled={true}
                color={Colors.darkgrey}
                fill
              /> :
              <OrderButton
                text='Extend pause' // AUTOPAUSE
                onPress={togglePause}
                disabled={isButtonPressDisabled}
                color={Colors.midgrey}
                fill
              />

      }

      <OrderButton
        text='Cancel my order'
        onPress={cancelOrder}
        disabled={isButtonPressDisabled}
        color={Colors.red}
        fill />
    </View>
  )

  if (isOrderForced) {
    return (
      <OrderButton
        text='Wait was overridden'
        disabled={true}
        color={Colors.midgrey} />
    )
  }

  // User not in order can still request waits
  return (
    <OrderButton
      text={isOrderWaitingForUser ? 'Undo wait for me' : 'Request wait for me'}
      onPress={waitOrder}
      disabled={isButtonPressDisabled}
      color={Colors.midgrey} />
  )
}

const MenuButton = ({ isOrderEnabled, isUserInOrderAnimated, isButtonPressDisabled }) => {
  const Button = isOrderEnabled ? OrderButton : Quandrant
  const navigation = useNavigation()
  const dispatch = useDispatch()

  const restaurant_id = useRestaurantID()
  const isListeningMenus = useSelector(selectIsListeningMenus)
  const isUserWithPriorOrder = useSelector(selectIsUserWithPriorOrder)
  const numberItemsInCart = useSelector(selectNumberOfItemsInCart) // billGroups, userID

  const menuPress = useCallback(() => {
    if (!isListeningMenus) dispatch(doRestaurantMenuStart(restaurant_id))
    navigation.navigate('Menu')
  }, [isListeningMenus,])

  return (
    <Button
      text={
        isOrderEnabled ?
          isUserInOrderAnimated ? 'View menu' : numberItemsInCart ? `${plurarize(numberItemsInCart, 'item', 'items')} in cart` : isUserWithPriorOrder ? 'Order more' : 'Order'
          : 'Menu'
      }
      onPress={menuPress}
      color={Colors.darkgreen}
      disabled={isButtonPressDisabled}
    />
  )
}

const ReceiptButton = ({ isOrderEnabled, isButtonPressDisabled }) => {
  const Button = isOrderEnabled ? OrderButton : Quandrant
  const navigation = useNavigation()
  const isBillStarted = useSelector(selectIsBillStarted)

  return (
    <Button
      text={isOrderEnabled ? 'Bill' : isBillStarted ? 'Past orders' : 'No past orders'}
      onPress={() => navigation.navigate('Bill')}
      color={isBillStarted || !isOrderEnabled ? Colors.purple : Colors.darkgrey}
      fill={!isBillStarted}
      disabled={isButtonPressDisabled || !isBillStarted}
    />
  )
}

const PayButtons = ({ isOrderEnabled, isUserInOrderAnimated, isButtonPressDisabled, isCancellingPayAll, setIsProcessingPayAll }) => {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const Button = isOrderEnabled ? OrderButton : Quandrant

  const bill_id = useBillID()
  const restaurant_id = useRestaurantID()

  const isPayEnabledBill = useSelector(selectIsBillPayEnabled)
  const isPayEnabledRestaurant = useSelector(selectRestaurantIsPayEnabled)

  const isBillUnpaid = useSelector(selectIsBillUnpaid)
  const billRemainingSubtotal = useSelector(selectBillRemainingSubtotal)
  const myClaimSubtotal = useSelector(selectMyClaimSubtotal)
  const isUserPayingAll = useSelector(selectIsUserPayingAll)
  const isOrderOccupied = useSelector(selectIsOrderOccupied)
  const isBillPartiallyPaid = useSelector(selectIsBillPartiallyPaid)
  const isBillPartiallyClaimed = useSelector(selectIsBillPartiallyClaimed)


  /*
    ISSUES:
      Cancel pay all backup
  */

  useFocusEffect(useCallback(() => {
    if (isUserPayingAll && !isCancellingPayAll && myClaimSubtotal) {
      dispatch(doAlertAdd(
        'Return to payment?',
        ['You had previously requested to pay for the entire bill.', 'Do you still wish to do so?'],
        [
          {
            text: `Yes, pay for ${centsToDollar(myClaimSubtotal)}`,
            onPress: () => navigation.navigate('Pay', { payAll: true })
          },
          {
            text: 'No, cancel',
            onPress: () => payAll(false)
          }
        ]
      ))
    }
  }, [isCancellingPayAll, isUserPayingAll, myClaimSubtotal]));

  const payAllPress = useCallback(() => {
    dispatch(doAlertAdd(
      `Pay for entire bill (${centsToDollar(billRemainingSubtotal)})?`,
      undefined,
      // [
      //   'This includes any items added by others at the table or your server.',
      //   ...isBillCartActive ? ['(note: some users may still be adding items to the order. You will not be charged for those)'] : [],
      // ],
      [
        {
          text: `Yes, pay ${centsToDollar(billRemainingSubtotal)}`,
          onPress: () => payAll(true)
        },
        {
          text: 'No, split the bill',
          onPress: () => navigation.navigate('Split')
        },
        {
          text: 'No, cancel',
        }
      ],
      undefined,
      true
    ))
  }, [billRemainingSubtotal])

  const payAll = useCallback(async (isClaiming) => {
    // note: onPress functions by default first param true
    try {
      setIsProcessingPayAll(true)
      await transactPayAll(restaurant_id, bill_id, !!isClaiming)
      console.log('after')

      setIsProcessingPayAll(false)
      if (isClaiming) {
        console.log('navigation')
        navigation.navigate('Pay', { payAll: true })
      }
    }
    catch (error) {
      console.log(`OrderNavigator payAll error: ${error}`)
      setIsProcessingPayAll(false)
      if (isClaiming) dispatch(doAlertAdd('Unable to pay all', 'Please try again, or pay through the split option.'))
      else {
        dispatch(doAlertAdd('Failed to cancel', 'Please go back to try again'))
        navigation.navigate('Pay', { payAll: true })
      }
    }
  }, [])

  if (isOrderEnabled) {
    if (!isPayEnabledBill || !isPayEnabledRestaurant) {
      return (
        <OrderButton
          text='Pay disabled'
          disabled
          color={Colors.darkgrey}
          fill />
      )
    }

    if (isUserInOrderAnimated) return null

    if (!isBillUnpaid) {
      return (
        <OrderButton
          text='No unpaid items'
          disabled
          color={Colors.darkgrey}
          fill />
      )
    }
  }

  const showPayAllButton = !isOrderEnabled || (!isBillPartiallyClaimed && !isBillPartiallyPaid)

  return (
    <View style={[styles.row, !isOrderEnabled && styles.flex]}>
      {
        showPayAllButton && <Button
          disabled={!isPayEnabledBill || !isPayEnabledRestaurant || !isBillUnpaid || isBillPartiallyClaimed || isBillPartiallyPaid || isButtonPressDisabled || isOrderOccupied}
          text='Pay all'
          color={isOrderOccupied ? Colors.darkgrey : Colors.red}
          onPress={payAllPress}
          billRemainingSubtotal={billRemainingSubtotal}
          fill
        />
      }
      <Button
        disabled={!isPayEnabledBill || !isPayEnabledRestaurant || !isBillUnpaid || isButtonPressDisabled}
        text='Split'
        color={Colors.red}
        onPress={() => navigation.navigate('Split')}
        fill
      />
      {!isOrderEnabled && (!isPayEnabledBill || !isPayEnabledRestaurant) && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center' }}>
        <ExtraLargeText center>Pay is disabled</ExtraLargeText>
        <ExtraLargeText center>by restaurant</ExtraLargeText>
      </View>}
    </View>
  )
}

const OrderButton = ({ text, onPress, disabled, color, fill, }) => {
  return <TouchableOpacity style={{ flex: 1 }} disabled={disabled} onPress={onPress}>
    <View style={{ marginTop: 18, marginHorizontal: 10, padding: 10, borderColor: color, borderWidth: 2, backgroundColor: fill ? color : null }}>
      <MediumText center bold>{text}</MediumText>
    </View>
  </TouchableOpacity>
}

const Quandrant = ({ text, onPress, disabled, color, billRemainingSubtotal }) => {
  const icon = useMemo(() => {
    switch (text) {
      case 'Menu':
        return <MaterialIcons name='restaurant-menu' size={Layout.window.width * 0.3} color={Colors.white + 'DA'} />
      case 'Bill':
        return <MaterialIcons name='chrome-reader-mode' size={Layout.window.width * 0.6} color={Colors.white + 'DA'} style={{ transform: [{ rotate: "-10deg" }, { translateX: -Layout.window.width * 0.1 }] }} />
      case 'Pay all':
        return <SuperLargeText bold>{centsToDollar(billRemainingSubtotal)}</SuperLargeText>
      case 'Split':
        // rhombus-split; border-all; pie-chart; view-carousel
        // rhombus-split might look less accountant / stingy
        return <FontAwesome name='pie-chart' size={Layout.window.width * 0.3} color={Colors.white + 'DA'} />

    }
  }, [billRemainingSubtotal])

  return <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.quadrant, { backgroundColor: disabled ? Colors.darkgrey : color }]}>
    <View style={{ flex: 1, opacity: disabled ? 0.2 : 1 }} >
      <ExtraLargeText bold style={{ position: 'absolute', top: 20, left: 20 }}>{text}</ExtraLargeText>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        {icon}
      </View>
    </View>
  </TouchableOpacity>
}




const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  row: {
    flexDirection: 'row'
  },
  flexRow: {
    flex: 1,
    flexDirection: 'row',
  },
  order: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.black + 'D1',
    padding: 20,
  },
  noOrder: {
    flex: 1,
    padding: 10,
  },
  quadrant: {
    flex: 1,
    margin: 10,
  },
});