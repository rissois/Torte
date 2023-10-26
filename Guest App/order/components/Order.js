import React, { useState, } from 'react';
import {
  StyleSheet,
  View
} from 'react-native';
import { DefaultText, MediumText, } from '../../utils/components/NewStyledText';
import OrderNavigator from './OrderNavigator';
import OrderCarts from './OrderCarts';
import { useIsRestaurantOffline } from '../../utils/hooks/useRestaurant';
import Layout from '../../utils/constants/Layout';

export default function Order({ setIsProcessingPayAll, setAlteringBillOrder, isCancellingPayAll }) {
  const isRestaurantOffline = useIsRestaurantOffline()

  const [navigatorHeight, setNavigatorHeight] = useState(null)

  return (
    <View style={{ flex: 1 }}>

      {
        isRestaurantOffline && <View style={{ marginHorizontal: Layout.marHor, paddingBottom: 20 }}>
          <MediumText center bold red>RESTAURANT OFFLINE</MediumText>
          <DefaultText center>This may be temporary, orders will submit when the system is back online.</DefaultText>
        </View>
      }

      <OrderCarts
        navigatorHeight={navigatorHeight}
      />

      <OrderNavigator
        setAlteringBillOrder={setAlteringBillOrder}
        setIsProcessingPayAll={setIsProcessingPayAll}
        setNavigatorHeight={setNavigatorHeight}
        navigatorHeight={navigatorHeight}
        isCancellingPayAll={isCancellingPayAll}
      />
    </View>
  )
}



const styles = StyleSheet.create({

});