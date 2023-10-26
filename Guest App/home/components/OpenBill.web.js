import React, { useState, } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';

import Colors from '../../utils/constants/Colors';
import { DefaultText, LargeText, } from '../../utils/components/NewStyledText';

import { setDoc, arrayRemove } from 'firebase/firestore'
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { useMyRef } from '../../utils/hooks/useUser';
import { useNavigation } from '@react-navigation/native';




export default function OpenBill({ bill }) {
  const myRef = useMyRef()
  const navigation = useNavigation()
  const { bill_id, restaurant: { id: restaurant_id, name = 'Missing' } = {},
    date,
  } = bill

  const [isClearing, setIsClearing] = useState(false)

  return <View style={{ marginTop: 16, }}>
    <LargeText center>{name} ({date})</LargeText>
    {/* <LargeText center>{name} ({asDate?.getMonth() + 1}/{asDate?.getDate()})</LargeText> */}
    <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', marginTop: 4 }}>
      <TouchableOpacity onPress={() => navigation.navigate('Link', { restaurant_id, bill_id, })}>
        <DefaultText style={{ color: Colors.green }}>View bill</DefaultText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => {
        setIsClearing(true)
        setDoc(
          myRef,
          {
            torte: { open_bills: arrayRemove(bill) }
          },
          { merge: true })
          .catch(error => {
            dispatch(doAlertAdd('Unable to clear the alert', 'Please restart the app and let us know if the issue persists'))
            console.log('HomeScreen OpenBill error clearing bill: ', error)
            setIsClearing(false)
          })
      }
      }>
        <DefaultText red>Clear alert</DefaultText>
      </TouchableOpacity>
    </View>
    {!!isClearing && <IndicatorOverlay text='Clearing bill' small />}
  </View>
}

const styles = StyleSheet.create({

});