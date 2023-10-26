/*
  Consider using getRestaurant to alert restaurant status (closed, no orders, etc.)
*/

import React, { useState, useRef, useCallback, useEffect, } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import { LargeText, DefaultText, ExtraLargeText, MediumText, SuperLargeText } from '../../utils/components/NewStyledText';
import { doTempRemoveBill, doTempRemoveTable, } from '../../redux/actions/actionsTemp';
import Colors from '../../utils/constants/Colors';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { useBillFromCode, } from '../../utils/hooks/useCodes';
import { selectTempBill, selectTempRestaurantID, selectTempRestaurantName, selectTempTableID, selectTempTableName } from '../../redux/selectors/selectorsTemp';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import Cursor from '../../utils/components/Cursor';
import Layout from '../../utils/constants/Layout';


export default function CodeBillScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const billInputRef = useRef(null)
  const getBillFromCode = useBillFromCode()
  const restaurant_name = useSelector(selectTempRestaurantName)
  const restaurant_id = useSelector(selectTempRestaurantID)
  const table_name = useSelector(selectTempTableName)
  const table_id = useSelector(selectTempTableID)
  const tempBill = useSelector(selectTempBill)

  const [billCode, setBillCode] = useState('')
  const [invalidBillCode, setInvalidBillCode] = useState(null)
  const [isFetchingBill, setIsFetchingBill] = useState(false)


  useEffect(() => {
    dispatch(doTempRemoveBill())
    billInputRef.current?.focus()
  }, [])

  const getBill = useCallback(async bill_code => {
    setIsFetchingBill(true)
    setInvalidBillCode(null)

    try {
      const { bill, rejoined } = await getBillFromCode(restaurant_id, table_id, bill_code)
      setIsFetchingBill(false)
      setBillCode('')

      if (!bill) throw new Error('Did not receive a bill from our database.')
      navigation.navigate('Link', { restaurant_id, bill_id: bill.id, isBillNewToUser: !rejoined, })
    }
    catch (error) {
      if (error.code !== 'functions/invalid-argument') {
        console.log('CodeBillScreen getBillFromCode error: ', error)
        dispatch(doAlertAdd('Error finding table', error.message))
      }
      setIsFetchingBill(false)
      setInvalidBillCode(bill_code)
      setBillCode('')
      billInputRef.current.focus()
    }
  }, [])

  return <SafeView>
    <Header back backFn={() => {
      dispatch(doTempRemoveTable())
      navigation.goBack()
    }}>
      <LargeText center>{restaurant_name}</LargeText>
    </Header>
    <MediumText center>{table_name}</MediumText>

    <View>
      {!!invalidBillCode && <ExtraLargeText center red style={{ opacity: invalidBillCode ? 1 : 0 }}>"{invalidBillCode}" NOT FOUND</ExtraLargeText>}

      <LargeText center>Enter the bill # shared by someone at your table:</LargeText>
      <TextInput
        ref={billInputRef}
        style={{
          height: 0,
          width: 0,
          color: 'rgba(43,52,69,0)'
        }}
        autoCompleteType='off'
        autoCorrect={false}
        contextMenuHidden
        keyboardAppearance='dark'
        keyboardType='number-pad'
        maxLength={4}
        value={billCode}
        onChangeText={setBillCode}
      />

      <JoinButton billInputRef={billInputRef} billCode={billCode} getBill={getBill} />

      {
        !!tempBill && <View>
          <DefaultText center style={{ marginVertical: 20 }}>- or -</DefaultText>

          <TouchableOpacity onPress={() => navigation.navigate('Link', { bill_id: tempBill.id, restaurant_id: tempBill.restaurant.id, })}>
            <DefaultText center bold>Return to old bill</DefaultText>
          </TouchableOpacity>
        </View>
      }


      <DefaultText center style={{ marginVertical: 20 }}>- or -</DefaultText>

      <TouchableOpacity onPress={() => dispatch(doAlertAdd('Only one bill per party', 'This table already has an open bill. What would you like to do?', [
        {
          text: 'Create separate bill',
          onPress: () => navigation.navigate('Link', { restaurant_id, table_id, create: true })
        },
        {
          text: 'Go back and join',
        },
      ]))}>
        <DefaultText center bold>I am the first</DefaultText>
        <DefaultText center>(we don't have a bill # yet)</DefaultText>
      </TouchableOpacity>

      {isFetchingBill && <IndicatorOverlay />}
    </View>
  </SafeView>
}


function JoinButton({ billInputRef, billCode, getBill }) {
  const validCode = billCode.length === 4
  return (
    <TouchableWithoutFeedback onPress={() => {
      billInputRef.current.focus()
    }}>
      <View style={styles.codeView}>
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <DisplayCharacters code={billCode} />
        </View>

        <View style={{ justifyContent: 'center' }}>
          <TouchableOpacity disabled={!validCode} onPress={() => getBill(billCode)} >
            <View style={[styles.codeButton, {
              backgroundColor: validCode ? Colors.darkgreen : Colors.darkgrey,
            }]}>
              <LargeText bold style={{ letterSpacing: 1 }}>JOIN</LargeText>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  )
}


function DisplayCharacters({ code }) {
  let fullDisplay = []
  for (let i = 0; i < 4; i++) {
    fullDisplay.push(<View key={i} style={styles.codeDigit}>
      {code.length === i ? <Cursor cursorOn noMargin /> :
        <SuperLargeText bold>{code[i] || ''}</SuperLargeText>}
    </View>
    )
  }

  return fullDisplay
}



const styles = StyleSheet.create({
  codeView: {
    marginTop: 20,
    marginHorizontal: Layout.marHor,
    flexDirection: 'row',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: Colors.darkgrey,
    borderRadius: 8,
  },
  codeDigit: {
    flex: 1,
    alignItems: 'center',
    borderBottomColor: Colors.green,
    borderBottomWidth: 2,
    marginHorizontal: 8,
  },
  codeButton: {
    marginLeft: 16,
    alignSelf: 'flex-start',
    padding: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center'
  },
});

