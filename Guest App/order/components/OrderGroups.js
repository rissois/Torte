import React, { } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { shallowEqual, useSelector } from 'react-redux';
import { ExtraLargeText, DefaultText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import arrayToCommaList from '../../utils/functions/arrayToCommaList';
import Layout from '../../utils/constants/Layout';
import plurarize from '../../utils/functions/plurarize';


import { selectUserIDsWithCarts, selectUserIDsWithOrders, selectUserIDsWithoutCarts } from '../../redux/selectors/selectorsBill';

import { useMyID } from '../../utils/hooks/useUser';
import { useBillUserNames } from '../../utils/hooks/useBillUsers';


export default function OrderGroups() {
  const none = useSelector(selectUserIDsWithoutCarts, shallowEqual)
  const cart = useSelector(selectUserIDsWithCarts, shallowEqual)
  const ready = useSelector(selectUserIDsWithOrders, shallowEqual)

  return <View style={{ marginTop: 20, alignSelf: 'center', }}>
    <OrderGroup status={'none'} user_ids={none} />
    <OrderGroup status={'cart'} user_ids={cart} />
    <OrderGroup status={'ready'} user_ids={ready} />
  </View>
}

const OrderGroup = ({ status, user_ids }) => {
  const myID = useMyID()
  const billUserNames = useBillUserNames()
  const groupNames = arrayToCommaList(user_ids.map(user_id => user_id === myID ? 'You' : billUserNames[user_id]))
  return <View style={{ marginHorizontal: Layout.window.width * 0.1, marginBottom: 20, }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', }}>
      <MaterialIcons
        name={status === 'ready' ? 'check-circle' : status === 'cart' ? 'shopping-cart' : 'clear'}
        size={24}
        color={status === 'ready' ? Colors.green : status === 'cart' ? Colors.red : Colors.lightgrey}
      />
      <ExtraLargeText style={{ marginLeft: 12 }}>{plurarize(user_ids.length, 'user', 'users')}</ExtraLargeText>
    </View>
    {!!user_ids.length && <View style={{ flexDirection: 'row', marginTop: 6 }}>
      <MaterialIcons
        name={status === 'ready' ? 'check-circle' : status === 'cart' ? 'shopping-cart' : 'clear'}
        size={24}
        color={Colors.background}
        style={{ opacity: 0 }}
      />
      <DefaultText center style={{ marginLeft: 12 }}>{groupNames}</DefaultText>
    </View>}
  </View>
}


const styles = StyleSheet.create({

});