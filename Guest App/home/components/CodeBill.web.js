/*
  Consider using getRestaurant to alert restaurant status (closed, no orders, etc.)
*/

import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  TextInput,
  Platform,
  TouchableOpacity,
  UIManager,
} from 'react-native';

import Colors from '../../utils/constants/Colors';

import { httpsCallable, getFunctions } from 'firebase/functions'

import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import { ExtraLargeText, DefaultText, LargeText, SuperLargeText, } from '../../utils/components/NewStyledText';
import Cursor from '../../utils/components/Cursor';
import { codeTextInputs } from '../constants/codeTextInputs';
import { useMyName } from '../../utils/hooks/useUser';
import firebaseApp from '../../firebase/firebase';

const functions = getFunctions(firebaseApp);

if (Platform.OS === 'android') {
  if (UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
  }
}

export default function CodeBill({ isFetchingBill, setIsFetchingBill, billRef, originalBill, startBillAndNavigate, createBill, restaurant_id, table }) {
  const myName = useMyName()

  const [billCode, setBillCode] = useState('')
  const [invalidBillCode, setInvalidBillCode] = useState('')

  const joinBill = useCallback(async (code) => {
    try {
      setInvalidBillCode('')
      setIsFetchingBill(true)

      let response = await httpsCallable(functions, 'bill-joinBillWithCode')({
        restaurant_id,
        table_id: table.id,
        code,
        name: myName,
      })

      startBillAndNavigate(response.data)
    }
    catch (error) {
      setBillCode('')
      setInvalidBillCode(code)
      console.log('CodeScreen joinBill error: ', error)
    }
    finally {
      setIsFetchingBill(false)
    }
  }, [restaurant_id, table])

  if (!table) {
    return null
  }

  return (
    <View>
      {!!invalidBillCode && <ExtraLargeText center red>"{invalidBillCode}" NOT FOUND</ExtraLargeText>}

      <LargeText center>Enter the bill # shared by someone at your table:</LargeText>
      <TextInput
        ref={billRef}
        style={codeTextInputs.fakeTextInput}
        autoCompleteType='off'
        autoCorrect={false}
        contextMenuHidden
        keyboardAppearance='dark'
        keyboardType='number-pad'
        maxLength={4}
        value={billCode}
        onChangeText={setBillCode}
      />

      <JoinButton billRef={billRef} billCode={billCode} joinBill={joinBill} />

      {
        !!originalBill && <View>
          <DefaultText center style={{ marginVertical: 20 }}>- or -</DefaultText>

          <TouchableOpacity onPress={() => startBillAndNavigate(originalBill)}>
            <DefaultText center bold>Return to old bill</DefaultText>
          </TouchableOpacity>
        </View>
      }


      <DefaultText center style={{ marginVertical: 20 }}>- or -</DefaultText>

      <TouchableOpacity onPress={() => createBill(restaurant_id, table)}>
        <DefaultText center bold>I am the first</DefaultText>
        <DefaultText center>(we don't have a bill # yet)</DefaultText>
      </TouchableOpacity>

      {isFetchingBill && <IndicatorOverlay />}
    </View>
  )
}

function JoinButton({ billRef, billCode, joinBill }) {
  const validCode = billCode.length === 4
  return (
    <TouchableWithoutFeedback onPress={() => {
      billRef.current.focus()
    }}>
      <View style={styles.codeView}>
        <View style={{ flexDirection: 'row', flex: 1 }}>
          <DisplayCharacters code={billCode} />
        </View>

        <View style={{ justifyContent: 'center' }}>
          <TouchableOpacity disabled={!validCode} onPress={() => joinBill(billCode)} >
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
        <SuperLargeText bold>{code[i] ?? ' '}</SuperLargeText>}
    </View>
    )
  }

  return fullDisplay
}



const styles = StyleSheet.create({
  codeView: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'center',
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

