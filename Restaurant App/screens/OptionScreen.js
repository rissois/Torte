import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,

  Alert,
  Platform,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, LargeText, MainText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { TextInput, TouchableWithoutFeedback, TouchableOpacity } from 'react-native-gesture-handler';
import Cursor from '../components/Cursor';
import centsToDollar from '../functions/centsToDollar';
import { MaterialIcons, } from '@expo/vector-icons';

export default function OptionScreen({ navigation, route }) {
  let { name = '', price = 0, index, options = [], max: fsMax = 1 } = route?.params
  const { tracker, items = {} } = useSelector(state => state)
  const [topInput, setTopInput] = useState(name)
  const [bottomInput, setBottomInput] = useState(price)
  const bottomRef = useRef(null)
  const [max, setMax] = useState(fsMax)
  const [bottomFocused, setBottomFocused] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const [alteredOption, setAlteredOption] = useState(false)

  // console.log(index)

  useEffect(() => {
    setAlteredOption(name !== topInput || price !== bottomInput || fsMax !== max)
  }, [topInput, bottomInput, max])


  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <MenuHeader leftText='Back' leftFn={() => { navigation.goBack() }} />

        {items.hasOwnProperty(tracker.item) && <HeaderText center>{items[tracker.item].name}</HeaderText>}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, justifyContent: 'center', width: Layout.window.width * 0.8, alignSelf: 'center' }}>
          <DisablingScrollView center keyboardShouldPersistTaps='always'>
            <View style={{}}>
              {!!submitError && <View style={{ position: 'absolute', left: 0, right: 0, top: -Layout.spacer.large }}>
                <LargeText style={{ letterSpacing: 2, textAlign: 'center', color: Colors.red, fontWeight: 'bold', }}>ERROR WITH SUBMISSION</LargeText>
              </View>}
              <LargeText style={{ textAlign: 'center' }}>What is the name of the option?</LargeText>
              {/* <ClarifyingText style={{ textAlign: 'center' }}>Try to keep this under 30 characters</ClarifyingText> */}
              <View style={{
                width: Layout.window.width * 0.7,
                alignSelf: 'center',
                marginTop: Layout.spacer.small,
                borderBottomColor: topInput ? Colors.softwhite : Colors.lightgrey,
                borderBottomWidth: 2,
                paddingBottom: 3,
              }}>
                <TextInput
                  style={{
                    fontSize: 34,
                    paddingHorizontal: 4,
                    color: Colors.softwhite,
                    textAlign: 'center',
                  }}
                  autoCapitalize={'sentences'}
                  autoCompleteType={'off'}
                  autoCorrect={false}
                  autoFocus
                  blurOnSubmit={false}
                  enablesReturnKeyAutomatically
                  onChangeText={text => setTopInput(text)}
                  onSubmitEditing={() => {
                    bottomRef.current.focus()
                  }}
                  placeholder='e.g. Tomato, Onion'
                  placeholderTextColor={Colors.lightgrey}
                  returnKeyType='next'
                  selectTextOnFocus
                  value={topInput}
                />
              </View>

            </View>

            <View style={{ minHeight: Layout.spacer.large }} />

            <View style={{}}>
              <LargeText center style={{ ...!topInput && { color: Colors.darkgrey } }}>What is the price of the option?</LargeText>
              <TouchableWithoutFeedback onPress={() => {
                if (topInput) {
                  bottomRef.current.focus()
                }
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginTop: Layout.spacer.small,
                  borderBottomColor: topInput ? Colors.softwhite : Colors.darkgrey,
                  borderBottomWidth: 2,
                  paddingBottom: 6,
                }}>
                  <View style={{ flex: 1 }} />
                  <HeaderText center style={{ color: topInput ? Colors.softwhite : Colors.darkgrey }}>{centsToDollar(bottomInput || 0)}</HeaderText>
                  <Cursor cursorOn={bottomFocused} />
                  <View style={{ flex: 1 }}>
                    {!bottomInput && <HeaderText style={{ color: topInput ? Colors.softwhite : Colors.darkgrey }}> (no charge)</HeaderText>}
                  </View>

                  <TextInput
                    style={{ height: 0, width: 0, color: Colors.backgroundColor }}
                    blurOnSubmit={false}
                    enablesReturnKeyAutomatically
                    selectTextOnFocus
                    keyboardType='number-pad'
                    onChangeText={text => {
                      if (!text) {
                        setBottomInput(0)
                      }
                      else {
                        let asNum = parseInt(text)
                        if (asNum) {
                          setBottomInput(asNum)
                        }
                      }
                    }}
                    ref={bottomRef}
                    onFocus={() => setBottomFocused(true)}
                    onBlur={() => setBottomFocused(false)}
                    // returnKeyType='done'
                    value={bottomInput.toString()}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>

            <View style={{ minHeight: Layout.spacer.large }} />

            <View style={{}}>
              <LargeText center style={{ ...!topInput && { color: Colors.darkgrey } }}>Can they request 2X, 3X, etc.?</LargeText>
              <View style={{ alignSelf: 'center', alignItems: 'center' }}>
                <MainText center style={{ ...!topInput && { color: Colors.darkgrey } }}>(What is the max quantity?)</MainText>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <TouchableOpacity disabled={max < 2 || !topInput} onPress={() => setMax(prev => prev - 1)}>
                    <MaterialIcons name='remove-circle-outline' size={34} color={!topInput ? Colors.darkgrey : max < 2 ? Colors.midgrey : Colors.softwhite} />
                  </TouchableOpacity>
                  <View style={{ minWidth: 100, }}>
                    <HeaderText center style={[{ fontSize: 60, }, { ...!topInput && { color: Colors.darkgrey } }]}>{max}</HeaderText>
                  </View>
                  <TouchableOpacity disabled={!topInput} onPress={() => setMax(prev => prev + 1)}>
                    <MaterialIcons name='add-circle-outline' size={34} color={!topInput ? Colors.darkgrey : Colors.softwhite} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>


            <View style={{ marginBottom: Layout.spacer.small, marginTop: Layout.spacer.medium, flexDirection: 'row', justifyContent: 'space-evenly' }}>
              <MenuButton text={typeof index === 'number' ? 'Discard changes' : 'Discard'} color={alteredOption ? Colors.red : Colors.darkgrey} buttonFn={() => {
                Alert.alert('Discard all changes?', undefined, [
                  {
                    text: 'Yes', onPress: () => {
                      setTopInput(name)
                      setBottomInput(price)
                      setMax(fsMax)
                    }
                  },
                  {
                    text: 'Cancel',
                    style: 'cancel'
                  },
                ])
              }} disabled={!alteredOption} />
              <MenuButton text={name ? 'Edit option' : 'Create option'} color={alteredOption && topInput ? Colors.purple : Colors.darkgrey} buttonFn={() => {
                if (options.includes(topInput)) {
                  Alert.alert('Cannot have two options with the same name', `This specification already has an option named ${topInput}. Please choose a different name for your guests to distinguish between the two.`)
                }
                else {
                  navigation.navigate('Spec', { name: topInput, price: bottomInput, index, max })
                }
              }} disabled={!topInput || !alteredOption} />
            </View>

          </DisablingScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View >
  );
}

const styles = StyleSheet.create({
  body: {
    width: Layout.window.width * 0.7,
    alignSelf: 'center'
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.34,
    shadowRadius: 6.27,

    elevation: 10,
  },
  rectPadding: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  }
});