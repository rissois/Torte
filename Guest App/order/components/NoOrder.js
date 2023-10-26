import React, { useMemo, useCallback, } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector, } from 'react-redux';
import { SuperLargeText, ExtraLargeText } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';

import { useBillID, useRestaurantID } from '../../utils/hooks/useBill';
import Layout from '../../utils/constants/Layout';
import { selectRestaurantIsPayEnabled } from '../../redux/selectors/selectorsRestaurant2';
import { selectBillRemainingSubtotal, selectIsBillPayEnabled, selectIsBillUnpaid, selectIsUserPayingAll } from '../../redux/selectors/selectorsBill';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import centsToDollar from '../../utils/functions/centsToDollar';
import { transactPayAll } from '../../pay/firestore/transactPayAll';
import { selectIsListeningMenus, } from '../../redux/selectors/selectorsListeners';
import { doRestaurantMenuStart } from '../../redux/actions/actionsRestaurants.web';
import { useFocusEffect, useNavigation, } from '@react-navigation/native';
import { selectMyClaimSubtotal } from '../../redux/selectors/selectorsBillUsers';


export default function NoOrder({ setIsProcessingPayAll, isCancellingPayAll }) {
  const navigation = useNavigation()
  const dispatch = useDispatch()
  const bill_id = useBillID()
  const restaurant_id = useRestaurantID()
  const isUserPayingAll = useSelector(selectIsUserPayingAll)

  const isPayEnabledBill = useSelector(selectIsBillPayEnabled)
  const isPayEnabledRestaurant = useSelector(selectRestaurantIsPayEnabled)
  const isBillUnpaid = useSelector(selectIsBillUnpaid)
  const billRemainingSubtotal = useSelector(selectBillRemainingSubtotal)
  const myClaimSubtotal = useSelector(selectMyClaimSubtotal)

  const isListeningMenus = useSelector(selectIsListeningMenus)

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

      setIsProcessingPayAll(false)
      if (isClaiming) {
        navigation.navigate('Pay', { payAll: true })
      }
    }
    catch (error) {
      console.log(`NoOrder payAll error: ${error}`)
      setIsProcessingPayAll(false)
      dispatch(doAlertAdd('Unable to pay all', 'Please try again, or pay through the split option.'))
    }
  }, [])

  const menuPress = useCallback(() => {
    if (!isListeningMenus) dispatch(doRestaurantMenuStart(restaurant_id))
    navigation.navigate('Menu')
  }, [isListeningMenus])

  // useFocusEffect dispatch pay all
  useFocusEffect(useCallback(() => {
    if (isUserPayingAll && !isCancellingPayAll) {
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


  return (
    <View style={{ flex: 1, backgroundColor: Colors.background, padding: 10 }}>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Quandrant backgroundColor={Colors.darkgreen} text='Menu' onPress={menuPress} />
        <Quandrant backgroundColor={Colors.purple} text='Bill' onPress={() => navigation.navigate('Bill')} />
      </View>
      <View style={{ flex: 1, flexDirection: 'row' }}>
        <Quandrant disabled={!isPayEnabledBill || !isPayEnabledRestaurant || !isBillUnpaid} backgroundColor={Colors.red} text='Pay all' onPress={payAllPress} billRemainingSubtotal={billRemainingSubtotal} />
        <Quandrant disabled={!isPayEnabledBill || !isPayEnabledRestaurant || !isBillUnpaid} backgroundColor={Colors.red} text='Split' onPress={() => navigation.navigate('Split')} />
        {(!isPayEnabledBill || !isPayEnabledRestaurant) && <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center' }}>
          <ExtraLargeText center>Pay is disabled</ExtraLargeText>
          <ExtraLargeText center>by restaurant</ExtraLargeText>
        </View>}
      </View>
    </View>
  )
}

const Quandrant = ({ backgroundColor, disabled, text, onPress, billRemainingSubtotal }) => {
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

  return <TouchableOpacity disabled={disabled} onPress={onPress} style={[styles.quadrant, { backgroundColor: disabled ? Colors.darkgrey : backgroundColor }]}>
    <View style={{ flex: 1, opacity: disabled ? 0.2 : 1 }} >
      <ExtraLargeText bold style={{ position: 'absolute', top: 20, left: 20 }}>{text}</ExtraLargeText>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
        {icon}
      </View>
    </View>
  </TouchableOpacity>
}


const styles = StyleSheet.create({
  quadrant: {
    flex: 1,
    margin: 10,
  }
});