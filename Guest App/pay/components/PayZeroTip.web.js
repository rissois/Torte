import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { MediumText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';

import Layout from '../../utils/constants/Layout';


import StyledButton from '../../utils/components/StyledButton';
import Header from '../../utils/components/Header';


export default function PayZeroTip({ isOpen, close, }) {

  const [zero, setZero] = useState('')
  const zeroRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      zeroRef?.current?.focus()
    }
    else {
      setZero('')
      zeroRef?.current?.blur()
    }
  }, [isOpen])

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.background }} behavior='position'>
      <View style={{ flex: 1 }} />
      <Header back backFn={close} />
      <View style={{ marginHorizontal: Layout.window.width * 0.1 }}>
        <MediumText bold center style={{ marginBottom: 20 }}>This restaurant has asked Torte to confirm tips of $0.00.</MediumText>
        <MediumText center style={{ marginBottom: 20 }}>Please type the word "ZERO" to confirm your tip of $0.00 was not an error.</MediumText>
        <View style={{ marginVertical: 8, paddingBottom: 2, borderColor: Colors.white, borderBottomWidth: 1 }}>
          <TextInput
            ref={zeroRef}
            style={{ color: Colors.white, fontSize: 36 }}
            autoFocus
            enablesReturnKeyAutomatically
            autoCapitalize='characters'
            selectTextOnFocus
            onChangeText={text => setZero(text.toUpperCase())}
            maxLength={4}
            placeholder='ZERO'
            placeholderTextColor={Colors.midgrey}
            value={zero}
          />
        </View>
      </View>

      <View style={{ flex: 1, paddingTop: 20 }}>
        <StyledButton
          center
          onPress={() => close(zero === 'ZERO')}
          color={zero === 'ZERO' ? Colors.red : Colors.purple}
          text={zero === 'ZERO' ? 'Confirm $0.00 tip' : 'Cancel'}
        />
      </View>
    </KeyboardAvoidingView>
  )
}


const styles = StyleSheet.create({
});