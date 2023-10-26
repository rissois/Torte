/*
  Consider using getRestaurant to alert restaurant status (closed, no orders, etc.)
*/

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import functions from '@react-native-firebase/functions'


import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';

import Colors from '../../utils/constants/Colors';
import { ExtraLargeText, LargeText, SmallText } from '../../utils/components/NewStyledText';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';

import { doRestaurantStart } from '../../redux/actions/actionsRestaurants';
import { doBillTypeSet } from '../../redux/actions/actionsBill';
import CodeConfirm from './CodeConfirm';
import { codeTextInputs } from '../constants/codeTextInputs';
import { useMyName } from '../../utils/hooks/useUser';

export default function CodeTableInput({
  tableRef,
  restaurant_id,
  startBillAndNavigate,
  handlePriorBill,
  changeTable,
  isFetchingBill,
  isFetchingTable,
  setIsFetchingTable
}) {
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const myName = useMyName()

  // User was exploring menu and now wants to create a bill
  const isRestaurantListenerOn = useSelector(state => !!state.listeners.restaurant.restaurant)

  const [tableCode, setTableCode] = useState('')
  const [invalidTableCode, setInvalidTableCode] = useState('')

  const checkTable = useCallback(async () => {
    try {
      setInvalidTableCode('')
      setIsFetchingTable(true)

      let response = await functions().httpsCallable('bill-checkTable')({
        restaurant_id,
        table_code: tableCode,
        name: myName,
      })

      if (response.data.bill) {
        // A new bill is created and returned when there is no bill on the table
        startBillAndNavigate(response.data.bill)
      }
      else if (response.data.prior) {
        // Prior returns the most recent bill that THIS USER is already a part of AT THIS TABLE
        // ... may be worth extending to all tables and warn change of table
        handlePriorBill(response.data.prior, response.data.table)
      }
      else {
        // Set the table to enter the bill code
        changeTable(response.data.table)
      }
    }
    catch (error) {
      setTableCode('')
      setInvalidTableCode(tableCode)
      console.log('CodeScreen checkTable error: ', error)
    }
    finally {
      setIsFetchingTable(false)
    }
  }, [restaurant_id, tableCode])

  useEffect(() => {
    // Required for android
    setTimeout(() => tableRef?.current?.focus(), 10)
  }, [])

  return (
    <View>
      {!!invalidTableCode && <ExtraLargeText center style={{ color: Colors.red }}>"{invalidTableCode}" NOT FOUND</ExtraLargeText>}

      <LargeText center>Enter the table or seat #</LargeText>
      <TextInput
        ref={tableRef}
        style={codeTextInputs.textInput}
        autoCapitalize='characters'
        contextMenuHidden
        onChangeText={setTableCode}
        value={tableCode}
      />

      <CodeConfirm onPress={checkTable} />


      <TouchableOpacity style={{ marginTop: 20 }} onPress={() => {
        if (!isRestaurantListenerOn) {
          dispatch(doRestaurantStart(restaurant_id))
          dispatch(doBillTypeSet('menu'))
        }
        navigation.replace('Menu')
      }}>
        <SmallText center>(I'm not ordering, just view menu)</SmallText>
      </TouchableOpacity>

      {isFetchingTable && <IndicatorOverlay />}
      {isFetchingBill && <IndicatorOverlay />}
    </View>
  )
}

