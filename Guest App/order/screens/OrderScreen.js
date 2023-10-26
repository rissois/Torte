import React, { useState, useMemo, } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useDispatch, useSelector, } from 'react-redux';
import Header from '../../utils/components/Header';
import { LargeText, } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Colors from '../../utils/constants/Colors';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';

import { doBillEnd } from '../../redux/actions/actionsBill';

import OrderNavigator from '../components/OrderNavigator';
import { useTableName, useBillCode } from '../../utils/hooks/useBill';
import OrderCarts from '../components/OrderCarts';
import { selectRestaurantChargeGratuity, selectRestaurantIsOrderEnabled } from '../../redux/selectors/selectorsRestaurant2';
import { selectIsBillUnpaid, selectIsOrderEnabled } from '../../redux/selectors/selectorsBill';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { TORTE_FEE } from '../../utils/constants/TORTE_FEE';

export default function OrderScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const isCancellingPayAll = route?.params?.isCancellingPayAll

  const unpaidGratuity = useSelector(selectRestaurantChargeGratuity)
  const isBillUnpaid = useSelector(selectIsBillUnpaid)
  const isOrderEnabledBill = useSelector(selectIsOrderEnabled)
  const isOrderEnabledRestaurant = useSelector(selectRestaurantIsOrderEnabled)

  // Basic bill details
  const tableName = useTableName()
  const billCode = useBillCode()

  const [navigatorHeight, setNavigatorHeight] = useState(null)
  const [alteringBillOrder, setAlteringBillOrder] = useState('')
  const [isProcessingPayAll, setIsProcessingPayAll] = useState(false)

  const headerRight = useMemo(() => {
    return <TouchableOpacity style={{ flexDirection: 'row' }} onPress={() => navigation.navigate('QR')}>
      {/* <Feather name='share' color={Colors.white} size={30} />
      <View style={{ width: 10 }} /> */}
      <MaterialCommunityIcons name='qrcode' color={Colors.white} size={30} />
    </TouchableOpacity>
  })

  const headerLeft = useMemo(() => {
    // CAN PROBABLY ALERT IF isOrderWithUser or unpaid items
    return <TouchableOpacity onPress={() => {
      if (isBillUnpaid) {
        dispatch(doAlertAdd('Leave without paying?', [
          'Please refer to our terms of use on how we handle unpaid items.',
          `There is a ${unpaidGratuity}% gratuity and ${TORTE_FEE}% fee for unpaid items at this restaurant.`
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

  return (
    <SafeView unsafeColor={Colors.background}>
      <Header left={headerLeft} right={headerRight}>
        <LargeText center numberOfLines={1} ellipsizeMode='tail'>#{billCode} - {tableName}</LargeText>
      </Header>

      {
        billCode ?
          <View style={{ flex: 1 }}>
            {
              isOrderEnabledRestaurant && isOrderEnabledBill && <View style={{ flex: 1 }}>
                <OrderCarts
                  navigatorHeight={navigatorHeight}
                />
              </View>
            }

            <OrderNavigator
              setAlteringBillOrder={setAlteringBillOrder}
              setIsProcessingPayAll={setIsProcessingPayAll}
              setNavigatorHeight={setNavigatorHeight}
              isCancellingPayAll={isCancellingPayAll}
              isOrderEnabled={isOrderEnabledRestaurant && isOrderEnabledBill}
            />
          </View> :
          <View style={{ flex: 1 }}>
            <IndicatorOverlay text='Loading bill' opacity='EA' />
          </View>
      }

      {!!alteringBillOrder && <IndicatorOverlay text={alteringBillOrder} black opacity='EA' />}
      {!!isProcessingPayAll && <IndicatorOverlay text='Saving' black opacity='EA' />}
    </SafeView>
  )
}



const styles = StyleSheet.create({

});