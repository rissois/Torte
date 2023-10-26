import React, { useState, useMemo, useCallback, useEffect, } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import { useDispatch, useSelector, } from 'react-redux';
import Header from '../../utils/components/Header';
import { LargeText, SuperLargeText, ExtraLargeText } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Colors from '../../utils/constants/Colors';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';

import { doBillEnd } from '../../redux/actions/actionsBill';

import { useTableName, useBillCode, useBillID, useRestaurantID } from '../../utils/hooks/useBill';
import Layout from '../../utils/constants/Layout';
import { selectRestaurantChargeGratuity, selectRestaurantIsPayEnabled } from '../../redux/selectors/selectorsRestaurant2';
import { selectBillRemainingSubtotal, selectIsBillPartiallyClaimed, selectIsBillPartiallyPaid, selectIsBillPayEnabled, selectIsBillStarted, selectIsBillUnpaid, selectIsUserPayingAll } from '../../redux/selectors/selectorsBill';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { TORTE_FEE } from '../../utils/constants/TORTE_FEE';
import centsToDollar from '../../utils/functions/centsToDollar';
import { transactPayAll } from '../../pay/firestore/transactPayAll';
import { selectIsListeningMenus, } from '../../redux/selectors/selectorsListeners';
import { doRestaurantMenuStart } from '../../redux/actions/actionsRestaurants.web';
import { useFocusEffect, useIsFocused, } from '@react-navigation/native';
import { selectMyClaimSubtotal } from '../../redux/selectors/selectorsBillUsers';


export default function NoOrderScreen({ navigation, route }) {
  const isCancellingPayAll = route?.params?.isCancellingPayAll
  const dispatch = useDispatch()
  const bill_id = useBillID()
  const restaurant_id = useRestaurantID()
  const isUserPayingAll = useSelector(selectIsUserPayingAll)

  const isPayEnabledBill = useSelector(selectIsBillPayEnabled)
  const isPayEnabledRestaurant = useSelector(selectRestaurantIsPayEnabled)
  const unpaidGratuity = useSelector(selectRestaurantChargeGratuity)
  const isBillUnpaid = useSelector(selectIsBillUnpaid)
  const isBillPartiallyClaimed = useSelector(selectIsBillPartiallyClaimed)
  const isBillPartiallyPaid = useSelector(selectIsBillPartiallyPaid)
  const billRemainingSubtotal = useSelector(selectBillRemainingSubtotal)
  const myClaimSubtotal = useSelector(selectMyClaimSubtotal)

  const isListeningMenus = useSelector(selectIsListeningMenus)

  // Basic bill details
  const tableName = useTableName()
  const billCode = useBillCode()


  const [isProcessingPayAll, setIsProcessingPayAll] = useState(false)

  const headerLeft = useMemo(() => {
    // CAN PROBABLY ALERT IF isOrderWithUser or unpaid items
    return <TouchableOpacity onPress={() => {
      if (isBillUnpaid) {
        dispatch(doAlertAdd('Leave without paying?', [
          'Please refer to our terms of use on how we handle unpaid items.',
          `There is a ${unpaidGratuity + TORTE_FEE}% charge for unpaid items at this restaurant.`
        ], [
          {
            text: 'Exit bill',
            onPress: () => {
              dispatch(doBillEnd())
              navigation.navigate('Home')
            }
          },
          {
            text: 'Go back'
          }
        ]))
      }
      else {
        dispatch(doBillEnd())
        navigation.navigate('Home')
      }
    }}>
      <MaterialIcons
        name='home'
        size={30}
        color={Colors.white}
      />
    </TouchableOpacity>
  }, [isBillUnpaid, unpaidGratuity])

  const payAllPress = useCallback(async (isClaiming) => {
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
      console.log(`NoOrderScreen payAllPress error: ${error}`)
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
            onPress: () => payAllPress(false)
          }
        ]
      ))
    }
  }, [isCancellingPayAll, isUserPayingAll, myClaimSubtotal]));


  return (
    <SafeView unsafeColor={Colors.background}>
      <Header left={headerLeft}>
        <LargeText center numberOfLines={1} ellipsizeMode='tail'>#{billCode} - {tableName}</LargeText>
      </Header>
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
      {!!isProcessingPayAll && <IndicatorOverlay text='Saving' black opacity='EA' />}
    </SafeView>
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