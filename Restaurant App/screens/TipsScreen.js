import React, { useState, useRef, useEffect, } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,

} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { ClarifyingText, HeaderText, LargeText, MainText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import firebase from '../config/Firebase';
import Cursor from '../components/Cursor';

import identicalArrays from '../functions/identicalArrays';
import RadioButton from '../components/RadioButton';
import centsToDollar from '../functions/centsToDollar';
import useRestaurant from '../hooks/useRestaurant';

const DECIMAL_REGEX = /^([0-9]*[.])?[0-9]*$/
const NUMBER_REGEX = /^[0-9]*$/
const MAX_PERCENT = 40
const DEFAULT_DOLLAR = [100, 150, 200]
const DEFAULT_PERCENT = [15, 18, 20]

export default function TipsScreen({ navigation, route }) {
  const restaurant_id = useRestaurant()
  const { restaurant: { gratuities: { auto_gratuity: fsAutoGratuity = 0 }, tip_options: { percent: fsPercent, values: fsValues } }, } = useSelector(state => state)

  const [percent, setPercent] = useState(fsPercent)
  const [percentValues, setPercentValues] = useState(percent ? fsValues : DEFAULT_PERCENT)
  const [dollarValues, setDollarValues] = useState(!percent ? fsValues : DEFAULT_DOLLAR)
  const [isOptionsAltered, setIsOptionsAltered] = useState(false)
  const [overMaxPercent, setOverMaxPercent] = useState(false)

  const [autoGratuity, setAutoGratuity] = useState(fsAutoGratuity)

  useEffect(() => {
    setIsOptionsAltered(percent !== fsPercent || autoGratuity !== fsAutoGratuity ||
      (percent && !identicalArrays(fsValues, percentValues)) ||
      (!percent && !identicalArrays(fsValues, dollarValues))
    )
  }, [percent, percentValues, dollarValues, fsPercent, fsValues, autoGratuity, fsAutoGratuity])

  useEffect(() => {
    setOverMaxPercent(percent && percentValues.some(val => val > MAX_PERCENT))
  }, [percent, percentValues])

  const saveOptions = async () => {
    try {
      firebase.firestore().collection('restaurants').doc(restaurant_id)
        .set({
          tip_options: { percent, values: (percent ? percentValues : dollarValues).map(val => parseInt(val)) },
          gratuities: { auto_gratuity: autoGratuity }
        },
          { merge: true })
      navigation.goBack()
    }
    catch (error) {
      console.log('TipsScreen saveOptions: ', error)
      Alert.alert('Could not save tip options', 'Please try again. Contact Torte support if the issue persists.')
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <MenuHeader leftText='Back' leftFn={() => { navigation.goBack() }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, }}>
          <DisablingScrollView
            // keyboardShouldPersistTaps='always' 
            contentContainerStyle={{ marginHorizontal: Layout.window.width * 0.1, }}>

            <HeaderText center style={{ marginBottom: Layout.spacer.medium }}>Tip Options</HeaderText>


            <LargeText center>What style of tips?</LargeText>

            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', margin: 20 }}>
              <TouchableOpacity onPress={() => setPercent(true)} style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}>
                <RadioButton on={percent} />
                <LargeText>Percentage</LargeText>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPercent(false)} style={{ flexDirection: 'row', alignItems: 'center', padding: 8 }}>
                <RadioButton on={!percent} />
                <LargeText>Dollar amount</LargeText>
              </TouchableOpacity>
            </View>

            <LargeText center style={{ marginTop: Layout.spacer.medium }}>Provide three options{percent ? ' (max 40%)' : ''}</LargeText>
            <MainText center>Tips will be presented in the order below</MainText>

            <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
              <Value
                value={percent ? percentValues[0] : dollarValues[0]}
                index={0}
                setValues={percent ? setPercentValues : setDollarValues}
                isPercent={percent}
              />

              <Value
                value={percent ? percentValues[1] : dollarValues[1]}
                index={1}
                setValues={percent ? setPercentValues : setDollarValues}
                isPercent={percent}
              />

              <Value
                value={percent ? percentValues[2] : dollarValues[2]}
                index={2}
                setValues={percent ? setPercentValues : setDollarValues}
                isPercent={percent}
              />
            </View>

            <LargeText center style={{ marginTop: Layout.spacer.medium }}>Do you have an gratuity for large parties?</LargeText>
            <MainText center>NOTE: Your server must toggle this manually</MainText>

            <Value
              value={autoGratuity}
              setValues={setAutoGratuity}
              isPercent
            />

            <View style={{ marginVertical: Layout.spacer.large, flexDirection: 'row', justifyContent: 'space-around' }}>
              <MenuButton text='Discard changes' color={isOptionsAltered ? Colors.red : Colors.darkgrey} buttonFn={() => {
                Alert.alert('Discard all changes?', undefined, [
                  {
                    text: 'Yes', onPress: () => {
                      setPercent(fsPercent)
                      setPercentValues(fsPercent ? fsValues : DEFAULT_PERCENT)
                      setDollarValues(!fsPercent ? fsValues : DEFAULT_DOLLAR)
                      setAutoGratuity(fsAutoGratuity)
                    }
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  },
                ])
              }} disabled={!isOptionsAltered} />
              <MenuButton text={overMaxPercent ? 'Max 40%' : isOptionsAltered ? 'Save changes' : 'No changes'} color={overMaxPercent ? Colors.red : isOptionsAltered ? Colors.purple : Colors.darkgrey} buttonFn={saveOptions} disabled={overMaxPercent || !isOptionsAltered} />
            </View>

          </DisablingScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View >
  );
}

// MULTIPLE THE RATE BEFORE YOU GET HERE.
const Value = ({ value, index = -1, setValues, isPercent }) => {
  const [inputFocused, setInputFocused] = useState()
  const inputRef = useRef(null)

  return <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.small, alignSelf: 'center' }}>

    <TouchableWithoutFeedback onPress={() => {
      inputRef?.current?.focus()
    }}>
      <View style={[styles.input, { minWidth: Layout.window.width * 0.18, flexDirection: 'row', justifyContent: 'center' }]}>
        <LargeText>{isPercent ? value : centsToDollar(value)}</LargeText>
        <Cursor cursorOn={inputFocused} />
        {isPercent && <LargeText style={{ marginLeft: 2 }}>%</LargeText>}

      </View>
    </TouchableWithoutFeedback>

    <TextInput
      style={{ height: 0, width: 0, color: Colors.backgroundColor }}
      enablesReturnKeyAutomatically
      keyboardType='decimal-pad'
      blurOnSubmit
      enablesReturnKeyAutomatically
      onSubmitEditing={() => Keyboard.dismiss()}
      onChangeText={text => {
        if (isPercent) {
          if (!text) {
            text = '0'
          }

          if (text.match(DECIMAL_REGEX)) {
            if (text[0] === '0' && parseInt(text[1])) {
              // trim leading 0s
              text = text[1]
            }

            setValues(prev => {
              if (~index) {
                let next = [...prev]
                next[index] = parseInt(text)
                return next
              }
              return parseInt(text)
            })
          }
        }
        else {
          if (!text) {
            setValues(prev => {
              if (~index) {
                let next = [...prev]
                next[index] = 0
                return next
              }
              return 0
            })
          }
          else if (text.match(NUMBER_REGEX)) {
            setValues(prev => {
              if (~index) {
                let next = [...prev]
                next[index] = parseInt(text)
                return next
              }
              return parseInt(text)
            })
          }
        }
      }}
      ref={inputRef}
      value={value.toString()}
      onFocus={() => {
        setInputFocused(true)
      }}
      onBlur={() => {
        setInputFocused(false)
      }}
    />
  </View>
}



const styles = StyleSheet.create({
  input: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.darkgrey,
  }
});
