/*
  Consider using getRestaurant to alert restaurant status (closed, no orders, etc.)
*/

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  LayoutAnimation,
  UIManager,
} from 'react-native';

import { useDispatch, useSelector } from 'react-redux';

import { getFunctions, httpsCallable } from 'firebase/functions'
import SafeView from '../../utils/components/SafeView';
import { doRestaurantStart } from '../../redux/actions/actionsRestaurants';
import { doBillStart, } from '../../redux/actions/actionsBill';
import { CommonActions } from '@react-navigation/native';
import { selectTrackedRestaurantOrCollection } from '../../redux/selectors/selectorsRestaurant';
import Header from '../../utils/components/Header';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import CodeTable from '../components/CodeTable';
import CodeBill from '../components/CodeBill';
import CodeRestaurant from '../components/CodeRestaurant';
import { useMyID, useMyName } from '../../utils/hooks/useUser';
import firebaseApp from '../../firebase/firebase';

const functions = getFunctions(firebaseApp)

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

// 
export default function CodeScreen({ navigation, route }) {
  useEffect(() => {
    // ROUTE.PARAMS receives bill-checkTable response from LinkScreen
    if (route?.params?.prior) {
      handlePriorBill(route.params.prior, route.params.table)
    }
  }, [])

  const dispatch = useDispatch()

  const myID = useMyID()
  const myName = useMyName()
  const reduxRestaurant = useSelector(selectTrackedRestaurantOrCollection())
  const isRestaurantPreexisting = !!reduxRestaurant.id

  const tableRef = useRef(null)
  const billRef = useRef(null)

  // PRECEDENCE: LinkScreen route.params.restaurant > redux from menu-only > null
  const [restaurant, setRestaurant] = useState(route?.params?.restaurant || (isRestaurantPreexisting ? reduxRestaurant : null))

  const [table, setTable] = useState(route?.params?.table || null)

  const [isFetchingTable, setIsFetchingTable] = useState(false)
  const [isFetchingBill, setIsFetchingBill] = useState(false)

  const [originalBill, setOriginalBill] = useState(route?.params?.prior || null)

  useEffect(() => {
    // Focus on bill if coming from Link
    if (route?.params?.prior) {
      setTimeout(() => billRef?.current?.focus(), 20)
    }
  }, [])

  const changeTable = useCallback((t) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTable(t)
    setTimeout(() => billRef?.current?.focus(), 20)
    setOriginalBill(prev => {
      if (prev?.table?.id === t.id) return prev
      return null
    })
  }, [])

  const handlePriorBill = (priorBill, table) => {
    setOriginalBill(priorBill)
    dispatch(doAlertAdd('You have an existing bill', 'What would you like to do?', [
      {
        text: 'Return to bill',
        onPress: () => startBillAndNavigate(priorBill)
      },
      {
        text: 'Join a different bill',
        onPress: () => changeTable(table)
      },
      {
        text: 'Create a new bill',
        onPress: () => createBill(table.restaurant.id, table, true)
      },
      {
        text: 'Cancel',
        onPress: () => {
          if (route?.params?.prior) navigation.goBack()
          else setTimeout(() => tableRef?.current?.focus(), 20)
        }
      }
    ]))
  }

  const createBill = useCallback(async (restaurant_id, table, skip_check) => {
    // Called when "I am the first" OR user has prior bill and table and wants to create a new one (checkTable)
    try {
      setIsFetchingBill(true)

      let response = await httpsCallable(functions, 'bill-createBill')({
        restaurant_id,
        table,
        name: myName,
        skip_check
      })

      // This code is only reached when stating "I am the first"
      if (response.data.occupied) {
        dispatch(doAlertAdd('Only one bill per party', 'This table already has an open bill. What would you like to do?', [
          {
            text: 'Go back and join',
          },
          {
            text: 'Separate bill (no sharing)',
            onPress: () => createBill(restaurant_id, table, true)
          },
        ]))
      }
      else if (response.data.empty) {
        dispatch(doAlertAdd(`Join bill at ${response.data.empty.table?.name}`, `The server has started a bill at ${response.data.empty.table?.name}. Is this the bill you wish to join?`, [
          {
            text: 'Yes, join',
            // must bring join bill from CodeBill to here
          },
          {
            text: 'No, cancel',
          },
        ]))
      }
      else {
        startBillAndNavigate(response.data.bill)
      }
    }
    catch (error) {
      dispatch(doAlertAdd('Unable to create bill', 'Please try again.'))
      console.log('CodeScreen createBill error: ', error)
    }
    finally {
      setIsFetchingBill(false)
    }
  }, [])

  const startBillAndNavigate = useCallback((bill) => {
    if (!isRestaurantPreexisting) {
      dispatch(doRestaurantStart(bill.restaurant.id))
    }
    dispatch(doBillStart(bill.restaurant.id, bill.id, !bill?.user_ids?.includes(myID)))

  }, [isRestaurantPreexisting])

  return <SafeView>
    <Header back />

    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? "padding" : undefined} style={{ flex: 1, paddingHorizontal: 40 }}>
      <View style={{ flex: !restaurant ? 8 : 0 }} />

      <CodeRestaurant
        isRestaurantPreexisting={isRestaurantPreexisting}
        restaurant={restaurant}
        setRestaurant={setRestaurant}

        isTable={!!table}
        tableRef={tableRef}
        isFetchingTable={isFetchingTable}
      />


      <View style={{ flex: restaurant && !table ? 8 : 0 }} />

      <CodeTable
        restaurant_id={restaurant?.id}

        table={table}
        setTable={setTable}
        tableRef={tableRef}
        isFetchingTable={isFetchingTable}
        setIsFetchingTable={setIsFetchingTable}
        changeTable={changeTable}

        handlePriorBill={handlePriorBill}
        startBillAndNavigate={startBillAndNavigate}

        isFetchingBill={isFetchingBill}
      />

      <View style={{ flex: 5, justifyContent: 'center', }}>
        <CodeBill
          restaurant_id={restaurant?.id}

          table={table}

          billRef={billRef}
          originalBill={originalBill}
          isFetchingBill={isFetchingBill}
          setIsFetchingBill={setIsFetchingBill}


          createBill={createBill}
          startBillAndNavigate={startBillAndNavigate}
        />
      </View>
    </KeyboardAvoidingView>
  </SafeView>
}



const styles = StyleSheet.create({

});

