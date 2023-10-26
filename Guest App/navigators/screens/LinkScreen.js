import React, { useState, useRef, useEffect, } from 'react';
import {
  View,
  Platform,
  UIManager,
  ActivityIndicator
} from 'react-native';

import { useDispatch, } from 'react-redux';

import Colors from '../../utils/constants/Colors';

import functions from '@react-native-firebase/functions'
import { LargeText, } from '../../utils/components/NewStyledText';
import { doRestaurantStart } from '../../redux/actions/actionsRestaurants';
import { doBillEnd, doBillStart, } from '../../redux/actions/actionsBill';
import { CommonActions, useIsFocused } from '@react-navigation/native';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import StyledButton from '../../utils/components/StyledButton';
import { checkIsTorteURL, parseURL } from '../functions/handleLinks';
import { useMyID, useMyName } from '../../utils/hooks/useUser';


if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function LinkScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const { url } = route?.params ?? {}
  const isFocused = useIsFocused();
  const [isStalled, setIsStalled] = useState(false)
  const isFocusedRef = useRef(isFocused)
  const [linkStatus, setLinkStatus] = useState('')

  const myName = useMyName()
  const myID = useMyID()

  useEffect(() => {
    isFocusedRef.current = isFocused
  }, [isFocused])

  useEffect(() => {
    const stalled = setTimeout(() => setIsStalled(true), 7000)

    return () => clearTimeout(stalled)
  }, [])

  // Likely needs abstraction with CodeScreen
  const startBill = (bill) => {
    setLinkStatus(Platform.OS === 'web' ? 'Opening bill' : 'Launching menu')
    dispatch(doBillEnd()) // Eliminate any prior bill

    dispatch(doBillStart(bill.restaurant.id, bill.id))
    dispatch(doRestaurantStart(bill.restaurant.id))

    if (!bill) return navigation.goBack()
    // GO TO MENU UNLESS YOU ARE IN THE ORDER OR HAVE ORDERED....
    if (bill?.order_status?.user_ids?.includes(myID) || bill?.user_status?.[myID]?.order_total || !bill?.is_order_enabled) {
      navigation.dispatch(
        CommonActions.reset({
          index: 1,
          routes: [
            { name: 'Home' },
            { name: 'Order' },
          ],
        }))
    }
    else {
      navigation.dispatch(
        CommonActions.reset({
          index: 2,
          routes: [
            { name: 'Home' },
            { name: 'Order' },
            { name: 'Menu', },
          ],
        })
      )
    }
    navigation.goBack()

  }

  const joinBill = async (restaurant_id, bill_id) => {
    try {
      setLinkStatus('Joining bill')
      let response = await functions().httpsCallable('bill-joinBillWithLink')({
        restaurant_id,
        name: myName,
        bill_id,
      })

      startBill(response.data)
    }
    catch (error) {
      console.log('LinkScreen JoinBill error: ', error)
      dispatch(doAlertAdd('Failed to open bill.', 'Please try again.'))
      navigation.goBack()
    }
  }

  const openTable = async (restaurant_id, table_code) => {
    try {
      setLinkStatus('Checking table...')
      let response = await functions().httpsCallable('bill-checkTable')({
        restaurant_id,
        table_code,
        name: myName,
      })

      if (response.data.bill) {
        startBill(response.data.bill)
      }
      else {
        // params will contain restaurant, table, and MAYBE prior
        navigation.navigate('Code', { ...response.data })
      }
    }
    catch (error) {
      console.log('LinkScreen OpenTable error: ', error)
      dispatch(doAlertAdd('Unable to join table.', 'Please try again, or use the code on your table'))
      navigation.goBack()
    }
  }

  useEffect(() => {
    setLinkStatus('Reading link')
    if (!url) {
      dispatch(doAlertAdd('Did not pick up a link'))
      navigation.goBack()
    }
    else if (!checkIsTorteURL(url)) {
      dispatch(doAlertAdd('This does not appear to be one of our QR codes.', 'You can only use Torte QR codes in the app'))
      navigation.goBack()
    }
    else {
      const { r: restaurant_id, t: table_code, b: bill_id } = parseURL(url)

      if (bill_id) {
        joinBill(restaurant_id, bill_id)
      }
      else {
        openTable(restaurant_id, table_code)
      }
    }
  }, [])


  return <View style={{ flex: 1, backgroundColor: Colors.black + 'F1' }}>
    <View style={{ flex: 1 }} />
    <View style={{ marginVertical: 40, alignItems: 'center' }}>
      <ActivityIndicator size='large' />
      <LargeText style={{ marginTop: 10 }}>{linkStatus}</LargeText>
    </View>
    <View style={{ flex: 1 }}>
      {isStalled && <StyledButton center text='Cancel' onPress={navigation.goBack} />}
    </View>
  </View>
}

