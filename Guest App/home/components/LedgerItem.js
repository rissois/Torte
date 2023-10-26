import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform
} from 'react-native';

import Layout from '../../utils/constants/Layout';

import Colors from '../../utils/constants/Colors';
import centsToDollar from '../../utils/functions/centsToDollar';
import months from '../../utils/constants/months';
import { DefaultText, MediumText } from '../../utils/components/NewStyledText';
import arrayToCommaList from '../../utils/functions/arrayToCommaList';
import { useMyID } from '../../utils/hooks/useUser';
import { MaterialIcons } from '@expo/vector-icons';

// ALL YOU NEED IS: NAME, PEOPLE... which you can't do anymore... AND DATE

export default function LedgerItem({ setSelected, bill }) {
  const myID = useMyID()
  const {
    timestamps: { created, closed },
    user_status,
    paid_summary: { total: paid } = {},
    order_summary: { total: ordered } = {},
    restaurant: { name: restaurant_name, id: restaurant_id
    } } = bill
  const { subtotal = 0, order_total = 0, paid_total = 0, number_of_payments = 0 } = user_status[myID] || {}

  const diners = useMemo(() => arrayToCommaList(Object.keys(user_status).filter(user_id => user_id !== myID).map(user_id => user_status[user_id].name)), [user_status])
  const [day, setDay] = useState('')

  const isReceipt = !restaurant_id

  useEffect(() => {
    let date = created.toDate()
    setDay(months[date.getMonth()] + ' ' + date.getDate())
  }, [created])

  return (
    <View style={styles.mealRow}>
      <TouchableOpacity onPress={() => setSelected(bill)} style={{ flexDirection: 'row', width: Layout.window.width }}>
        <View style={styles.mealDate}>
          <Text style={[styles.mealDateText, { color: isReceipt ? Colors.green : closed || paid >= ordered ? Colors.green : Colors.red }]}>{day}</Text>
        </View>
        <View style={styles.mealDetails}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <MediumText numberOfLines={1} ellipsizeMode={'tail'}>{restaurant_name}</MediumText>
            {isReceipt && <MaterialIcons name='photo-camera' size={20} color={Colors.lightgrey} style={{ paddingHorizontal: 8 }} />}
          </View>
          <DefaultText lightgrey numberOfLines={1} ellipsizeMode={'tail'}>{!!diners ? diners : '(no other users)'}</DefaultText>
        </View>
        <View style={styles.mealPaid}>
          {
            isReceipt ? <MediumText >{centsToDollar(subtotal)}</MediumText> :
              number_of_payments ? <MediumText >{centsToDollar(paid_total)}</MediumText> :
                closed || paid >= ordered ? <MediumText >{centsToDollar(paid)}</MediumText> :
                  order_total ? <MediumText red bold>UNPAID</MediumText> :
                    <MediumText bold>NEW</MediumText>
          }
        </View>
      </TouchableOpacity>
    </View >
  )
}

const styles = StyleSheet.create({
  mealRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.midgrey,
    paddingVertical: 8,
  },
  mealDate: {
    marginTop: 2,
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealDateText: {
    fontSize: 18,
    fontFamily: Platform.OS === 'ios' ? 'AvenirNextCondensed-Bold' : 'sans-serif',
  },
  mealDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  restaurantText: {
    fontSize: 17,
    fontWeight: '400',
    color: Colors.white,
  },
  mealFriends: {
  },
  mealFriendsText: {
    fontSize: 15,
    fontWeight: '400',
    color: Colors.lightgrey,
  },
  mealPaid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginRight: 16,
    minWidth: 100,
  },
});

