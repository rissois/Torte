import React, { useState, useEffect, useCallback, } from 'react';
import {
  View,
  ActivityIndicator
} from 'react-native';

import { useDispatch, } from 'react-redux';

import Colors from '../../utils/constants/Colors';

import { LargeText, } from '../../utils/components/NewStyledText';
import { doRestaurantStart } from '../../redux/actions/actionsRestaurants';
import { doBillStart, } from '../../redux/actions/actionsBill';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';

import StyledButton from '../../utils/components/StyledButton';
import { useBillFromID, useCreateBillAtTable, useTableCodeResponse, useTableFromCodeOrID } from '../../utils/hooks/useCodes';
import { doTempSetTable } from '../../redux/actions/actionsTemp';
import { doRestaurantMenuStart } from '../../redux/actions/actionsRestaurants.web';
import { getFunctions, httpsCallable } from 'firebase/functions'
import { doReceiptStart } from '../../redux/actions/actionsReceipt.web';

import firebaseApp from '../../firebase/firebase';
const functions = getFunctions(firebaseApp)

const API_STALL = 7000
const REDUX_STALL = 5000

// REMINDER: You can toggle the background color...

export default function LinkScreen({ navigation, route }) {
  /*
    CodeBill
      bill was joined { restaurant_id, bill_id: bill.id, isBillNewToUser: !rejoined }
      return to old bill { bill_id: bill.id, restaurant_id: bill.restaurant.id }
      * create new bill { restaurant_id, table_id, create: true } 
    CodeTable
      Return to old bill { restaurant_id, bill_id: bill.id, }
      * Create new bill { restaurant_id, table_id: table.id, create: true }
      Auto-created { restaurant_id, bill_id: bill.id, isBillNewToUser: true}
      * Empty bill { restaurant_id, bill_id: empty, join: true }
      View menu { restaurant_id }
    Location
      Open restaurant menus { restaurant_id: restaurant.id }
    Scan
      * { restaurant_id, table_code, bill_id, scan: true } // R+B, R+T or just R
    Name
      * { restaurant_id, bill_id, table_id, scan: true, }
    OpenBill
    LedgerModal
  */

  const dispatch = useDispatch()

  const {
    restaurant_id,
    table_code,
    table_id,
    bill_id,
    create,
    join,
    scan,
    receipt_id,

    isRestaurantNavStateReset,
    isBillNewToUser,

    isReceiptNewToUser,
  } = route?.params ?? {}

  const [isStalled, setIsStalled] = useState(false)
  const [status, setStatus] = useState('Please wait')
  const createBillAtTable = useCreateBillAtTable()
  const tableFromCodeOrID = useTableFromCodeOrID()
  const billFromID = useBillFromID()
  const handleTableCodeResponse = useTableCodeResponse()

  const triggerInvocation = useCallback(async () => {
    const startRedux = () => {
      setTimeout(() => setIsStalled(true), REDUX_STALL)
      if (receipt_id) {
        setStatus('Opening receipt')
        dispatch(doReceiptStart(receipt_id, isReceiptNewToUser))
        // Receipt return function has access to isReceiptNewToUser
      }
      else if (bill_id) {
        setStatus('Starting bill')
        dispatch(doBillStart(restaurant_id, bill_id, isBillNewToUser))
      }
      else {
        setStatus('Fetching menu')
        dispatch(doRestaurantStart(restaurant_id, true, isRestaurantNavStateReset))
        dispatch(doRestaurantMenuStart(restaurant_id))
      }
    }

    const handleBillIDResponse = (data) => {
      if (data.unnamed) {
        dispatch(doTempSetTable(data.table))
        navigation.replace('Name', { bill_id, })
      }
      else {
        navigation.replace('Link', { restaurant_id, bill_id: data.bill.id, isBillNewToUser: !data.rejoined, })
      }
    }

    try {
      const stalledTimeout = setTimeout(() => setIsStalled(true), API_STALL)

      if (scan) {
        if (receipt_id) {
          setStatus('Joining receipt')
          const { data } = await httpsCallable(functions, 'scanReceipt-joinReceipt')({ receipt_id })
          if (data.unnamed) {
            navigation.replace('Name', { receipt_id })
          }
          else {
            navigation.replace('Link', { receipt_id, isReceiptNewToUser: !data.rejoined, })
          }
        }
        else if (bill_id) {
          setStatus('Checking bill')
          const data = await billFromID(restaurant_id, bill_id)
          handleBillIDResponse(data)
        }
        else {
          setStatus('Checking table')
          const data = await tableFromCodeOrID(restaurant_id, table_code, table_id)
          handleTableCodeResponse(data, true)
        }
      }
      else if (create) {
        setStatus('Creating bill')
        const data = await createBillAtTable(restaurant_id, table_id)
        handleBillIDResponse(data)
      }
      else if (join) {
        setStatus('Joining bill')
        const data = await billFromID(restaurant_id, bill_id)
        handleBillIDResponse(data)
      }
      else {
        clearTimeout(stalledTimeout)
        startRedux()
      }
    }
    catch (error) {
      console.log('LinkScreen triggerInvocation error: ', error)
      dispatch(doAlertAdd('An error occurred', error.message))
      navigation.goBack()
    }

  }, [])

  useEffect(() => {
    if (!restaurant_id && !receipt_id) return navigation.goBack() // this should never happen

    triggerInvocation()
  }, [])

  return <View style={{ flex: 1, backgroundColor: Colors.black + 'F1' }}>
    <View style={{ flex: 1 }} />
    <View style={{ marginVertical: 40, alignItems: 'center' }}>
      <ActivityIndicator size='large' />
      <LargeText style={{ marginTop: 10 }}>{status}</LargeText>
    </View>
    <View style={{ flex: 1 }}>
      {isStalled && <StyledButton center text='Cancel' onPress={navigation.goBack} />}
    </View>
  </View>
}

