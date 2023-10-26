const isHeaderDisabled = !__DEV__
const headerTouchable = async () => {
  try {
    console.log('TOUCHED')
    const result = await firebase.functions().httpsCallable('test-test')({
      restaurant_id: 'K00IXKl5xiNmsTBYro0dRSK8gtA3',
      // isTransaction: true,
      // isThrowing: true,
      // isErroring: true,
      isUnknown: true,
    })
    console.log('CALL FINISHED')
    console.log(result.data)
    console.log('END')
  }
  catch (error) {
    console.log('ERROR')
    console.log('CODE: ', error.code)
    console.log('MESSAGE: ', error.message)
    console.log('TOGETHER: ', error)
  }
}

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  UIManager,
  TouchableOpacity,
} from 'react-native';
import { ExtraLargeText, LargeText, SerifText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';

import SafeView from '../../utils/components/SafeView';
import OrderAlerts from '../components/OrderAlerts'
import BillThumbnails from '../components/BillThumbnails';
import Bill from '../../bill/components/Bill';
import Order from '../../order/components/Order';
import Header from '../../utils/components/Header';
import ManageDrawer from '../components/ManageDrawer';
import { useFocusEffect } from '@react-navigation/native';
import SoldOutButton from '../components/SoldOutButton';
import SoldOut from '../components/SoldOut';
import useIsMyAccountAdmin from '../../utils/hooks/useIsMyAccountAdmin';
import { useRestaurantID, useRestaurantName, useRestaurantRef } from '../../utils/hooks/useRestaurant';
import PortalSelector from '../../portal/components/PortalSelector';
import { useDispatch, useSelector } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import firebase from 'firebase';

// See https://reactnative.dev/docs/layoutanimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function DashboardScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const [billID, setBillID] = useState('')
  const [orderTableID, setOrderTableID] = useState('')
  const [isSoldOutOpen, setIsSoldOutOpen] = useState(false)
  const [isMananageDrawerOpen, setIsManageDrawerOpen] = useState(false)
  const [showTableSelector, setShowTableSelector] = useState(false)
  const [isCreatingBill, setIsCreatingBill] = useState()
  const isMyAccountAdmin = useIsMyAccountAdmin()
  const restaurantName = useRestaurantName()
  const restaurant_id = useRestaurantID()

  // const test = useSelector(state => state.billItems)
  // console.log('DASHBOARD: ', Object.keys(test))

  const headerLeft = useMemo(() => (
    <View style={{ flexDirection: 'row', }}>
      <TouchableOpacity onPress={() => {
        setIsManageDrawerOpen(prev => !prev)
      }}>
        <View style={styles.manageButton}>
          <LargeText bold>MANAGE</LargeText>
        </View>
      </TouchableOpacity>
    </View>
  ), [])

  const headerRight = useMemo(() => <SoldOutButton setIsSoldOutOpen={setIsSoldOutOpen} />, [])

  const closeBill = useCallback(() => setBillID(''), [])
  const closeTable = useCallback(() => setOrderTableID(''), [])
  const closeManageDrawer = useCallback(() => setIsManageDrawerOpen(false), [])

  useFocusEffect(useCallback(() => {
    // Allows opening MANAGE drawer, but once navigating away close these.
    closeBill()
    closeTable()
  }, []))

  const createBill = useCallback(async (table_id, ignoreOpenBills) => {
    try {
      setIsCreatingBill(true)
      const response = await firebase.functions().httpsCallable('bill2-createEmptyBillAtTable')({
        restaurant_id,
        table_id,
        ignoreOpenBills,
      })

      if (response.data.occupied) {
        dispatch(doAlertAdd(`There is already a bill at this table`, 'Create another?', [
          {
            text: 'Yes',
            onPress: () => createBill(table_id, true)
          },
          {
            text: 'No',
          }
        ]))
      }
      else {
        dispatch(doAlertAdd(`Bill #${response.data.bill.bill_code} created at ${response.data.bill.table.name}`))
      }
    }
    catch (error) {
      console.log('DashboardScren CreateBill error: ', error)
      dispatch(doAlertAdd('Failed to create bill', 'Please try again and let Torte know if the error persists'))

    }
    finally {
      setIsCreatingBill(false)
    }
  }, [restaurant_id])

  return (
    <SafeView unsafeColor={Colors.purple}>
      <Header left={headerLeft} right={headerRight}>
        <TouchableOpacity disabled={isHeaderDisabled} onPress={headerTouchable}>
          <SerifText center numberOfLines={1} ellipsizeMode='tail'>{isMyAccountAdmin ? restaurantName : 'Torte'}</SerifText>
        </TouchableOpacity>
      </Header>
      <View style={{ flexDirection: 'row' }}>

      </View>
      <View style={{ flexDirection: 'row', flex: 1 }}>
        <View style={styles.orderAlerts}>
          <OrderAlerts openOrder={setOrderTableID} />
        </View>
        <View style={styles.billThumbnailsShadowPad}>
          <View style={styles.billThumbnails}>
            <BillThumbnails setBillID={setBillID} />
            <TouchableOpacity disabled={isCreatingBill} onPress={() => setShowTableSelector(true)}>
              <View style={styles.createBillButton}>
                <ExtraLargeText center bold>+ CREATE BILL +</ExtraLargeText>
              </View>
              {isCreatingBill && <IndicatorOverlay />}
            </TouchableOpacity>
          </View>
        </View>
        {!!billID && <Bill bill_id={billID} closeBill={closeBill} setOrderTableID={setOrderTableID} isDashboard />}
        {!!orderTableID && <Order table_id={orderTableID} closeOrder={closeTable} />}
        {isMananageDrawerOpen && <ManageDrawer isOpen={isMananageDrawerOpen} closeDrawer={closeManageDrawer} />}
      </View>
      <SoldOut isSoldOutOpen={isSoldOutOpen} setIsSoldOutOpen={setIsSoldOutOpen} />

      {showTableSelector && <PortalSelector
        category='tables'
        selected=''
        setSelected={createBill}
        close={() => setShowTableSelector(false)}
      />}
    </SafeView>
  )
}


const styles = StyleSheet.create({
  orderAlerts: {
    flex: 2,
    backgroundColor: Colors.darkgrey
  },
  billThumbnailsShadowPad: {
    flex: 1, paddingLeft: 20, backgroundColor: Colors.darkgrey, overflow: 'hidden',
  },
  billThumbnails: {
    flex: 1,
    backgroundColor: Colors.background,
    shadowColor: "#000",
    shadowOffset: {
      width: -5
    },
    shadowOpacity: 0.51,
    shadowRadius: 13.16,

    elevation: 20,

  },
  createBillButton: {
    backgroundColor: Colors.purple,
    paddingVertical: 20,
    borderColor: Colors.white,
    borderWidth: 2,
  },
  manageButton: {
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginHorizontal: 4,
    marginTop: 4,
    borderWidth: 2,
    borderColor: Colors.white
  }
});
