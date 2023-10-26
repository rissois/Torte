import React, { useState, useEffect, useRef, useMemo, } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,

} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Header from '../../utils/components/Header';
import { DefaultText, LargeText, } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';

import { useTableName, useBillCode } from '../../utils/hooks/useBill';


import BillUserScroller from '../components/BillUserScroller';
import BillViewer from '../components/BillViewer';
import Colors from '../../utils/constants/Colors';

import { query, getFirestore, collection, getDoc, doc, onSnapshot } from 'firebase/firestore'
import { doBillCategorySet, doBillEnd } from '../../redux/actions/actionsBill';
import { querySnapshotToObject } from '../../utils/functions/handleQueries';
import BackIcon from '../../utils/components/BackIcon';
import { useMyID, useMyRef } from '../../utils/hooks/useUser';
import firebaseApp from '../../firebase/firebase';

const firestore = getFirestore(firebaseApp)

export default function BillScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const tableName = useTableName()
  const billCode = useBillCode()

  const billViewerRef = useRef(null)

  const [selectedUser, setSelectedUser] = useState('table')

  const myRef = useMyRef()
  const bill_id = useSelector(state => state.bill.bill?.id)
  const restaurant_id = useSelector(state => state.bill.bill?.restaurant?.id)

  const [isReceipt, setIsReceipt] = useState(!!route?.params?.isReceipt)
  const [isLoading, setIsLoading] = useState(!!route?.params?.isReceipt)
  const [userPaid, setUserPaid] = useState({})

  const headerLeft = useMemo(() => {
    // CAN PROBABLY ALERT IF isUserInOrder or unpaid items
    return <BackIcon backFn={() => {
      if (route?.params?.isReceipt) {
        dispatch(doBillEnd())
      }
      navigation.goBack()
    }} />
  }, [])

  useEffect(() => {
    if (isLoading && bill_id && restaurant_id) {

      const billItemsQuery = query(collection(firestore, 'Restaurants', restaurant_id, 'Bills', bill_id, 'BillItems'))
      onSnapshot(billItemsQuery, querySnapshot => {
        dispatch(doBillCategorySet('billItems', querySnapshotToObject(querySnapshot)))
      })

      getDoc(myRef, doc => {
        setUserPaid(doc.data().paid_summary)
      })

      setIsLoading(false)
    }
  }, [bill_id, restaurant_id])


  return (
    <SafeView scroll>
      <Header left={headerLeft} right={<TouchableOpacity onPress={() => setIsReceipt(prev => !prev)}><DefaultText>{isReceipt ? 'orders' : 'paid'}</DefaultText></TouchableOpacity>}>
        <LargeText center numberOfLines={1} ellipsizeMode='tail'>#{billCode} - {tableName}</LargeText>
      </Header>


      <View style={{ paddingTop: 5, paddingBottom: 15 }}>
        <BillUserScroller billViewerRef={billViewerRef} selectedUser={selectedUser} setSelectedUser={setSelectedUser} isReceipt={isReceipt} />
      </View>

      <LargeText center bold style={{ color: isReceipt ? Colors.green : Colors.red, paddingBottom: 10 }}>{isReceipt ? 'PAID ITEMS' : 'ORDERED ITEMS'}</LargeText>

      <BillViewer
        billViewerRef={billViewerRef}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        isReceipt={isReceipt}
        tips={userPaid.tips}
        discounts={userPaid.discounts}
        isLoading={isLoading}
      />

    </SafeView>
  )
}


const styles = StyleSheet.create({
});