import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  TouchableOpacity,

  KeyboardAvoidingView,
  TextInput,
} from 'react-native';
import { MediumText, SuperLargeText, } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Colors from '../../utils/constants/Colors';

import Layout from '../../utils/constants/Layout';


import BackIcon from '../../utils/components/BackIcon';
import StyledButton from '../../utils/components/StyledButton';


export default function PayZeroTip({ isOpen, close, handlePayButton }) {

  const [zero, setZero] = useState('')
  const zeroRef = useRef(null)
  const [zeroWidth, setZeroWidth] = useState(null)

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
    <SafeView >
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? "padding" : undefined} style={{ flex: 1, paddingHorizontal: Layout.window.width * 0.1, }}>
        <View style={{ flex: 1 }}>
          <TouchableOpacity onPress={close}>
            <BackIcon name='close' />
          </TouchableOpacity>
        </View>
        <MediumText bold center style={{ marginBottom: 20 }}>This restaurant has asked Torte to confirm tips of $0.00.</MediumText>
        <MediumText center style={{ marginBottom: 20 }}>Please type the word "ZERO" to confirm your tip of $0.00 was not an error.</MediumText>

        <View style={{ alignSelf: 'center', width: zeroWidth }}>
          <TextInput
            onLayout={({ nativeEvent }) => setZeroWidth(prev => nativeEvent.layout.width > prev ? nativeEvent.layout.width : prev)}
            ref={zeroRef}
            style={{
              paddingHorizontal: 12,
              paddingBottom: 4,
              borderBottomColor: Colors.white,
              borderBottomWidth: 1,
            }}
            autoFocus
            enablesReturnKeyAutomatically
            autoCapitalize='characters'
            selectTextOnFocus
            onChangeText={text => setZero(text.toUpperCase())}
            maxLength={4}
            placeholder='ZERO'
            placeholderTextColor={Colors.midgrey}
          >
            <SuperLargeText>{zero}</SuperLargeText>
          </TextInput>
        </View>


        <View style={{ flex: 1 }}>
          <View style={{ paddingTop: 20 }}>
            <StyledButton
              center
              onPress={() => {
                close()
                if (zero === 'ZERO') {
                  handlePayButton()
                }
              }}
              color={zero === 'ZERO' ? Colors.red : Colors.purple}
              text={zero === 'ZERO' ? 'Confirm $0.00 tip' : 'Cancel'}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeView>

  )
}


const styles = StyleSheet.create({
});