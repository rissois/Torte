import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,

  Platform,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, TouchableOpacity, TouchableWithoutFeedback } from 'react-native-gesture-handler';
import filterTitles from '../constants/filterTitles';
import RadioButton from '../components/RadioButton';
import Cursor from '../components/Cursor';
import centsToDollar from '../functions/centsToDollar';

/*
  BREAK THIS OUT
  SO YOU CAN CREATE SEPARATE, MORE MANAGEABLE FUNCTIONS
*/

export default function FilterScreen({ navigation, route }) {
  let { filters, filter, name } = route?.params
  // let { tracker: { item: item_id } } = useSelector(state => state)
  // let { restaurant_id } = useSelector(state => state.restaurant)
  let initial = filters?.[filter]
  // Not actually necessary... you could just do a param and if no param then you know it's new
  const [topInput, setTopInput] = useState('')
  const [bottomInput, setBottomInput] = useState(0)
  const bottomRef = useRef(null)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    if (initial === true) {
      setTopInput('always')
    }
    else if (typeof initial === 'number') {
      setTopInput('price')
      setBottomInput(initial || 0)
    }
    else {
      setTopInput('never')
    }
  }, [initial])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <MenuHeader leftText='Back' leftFn={() => { navigation.goBack() }} />
        <HeaderText center >{name}</HeaderText>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, justifyContent: 'center', alignSelf: 'center', }}>
          <DisablingScrollView center keyboardShouldPersistTaps='always' contentContainerStyle={{ alignItems: 'center', }}>
            {!!submitError && <View style={{ position: 'absolute', left: 0, right: 0, top: -Layout.spacer.large }}>
              <LargeText style={{ letterSpacing: 2, textAlign: 'center', color: Colors.red, fontWeight: 'bold', }}>{'ERROR WITH SUBMISSION'}</LargeText>
            </View>}
            <View style={{ width: Layout.window.width * 0.7, }}>
              <LargeText style={{ textAlign: 'center', }}>When is this dish {filterTitles[filter].toLowerCase()}?</LargeText>

              <View style={{ alignSelf: 'center' }}>
                <TouchableOpacity onPress={() => {
                  bottomRef.current.blur()
                  setTopInput('always')
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.small }}>
                    <RadioButton on={topInput === 'always'} />
                    <MainText>Dish is always {filterTitles[filter].toLowerCase()}</MainText>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {
                  bottomRef.current.blur()
                  setTopInput('never')
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.small }}>
                    <RadioButton on={topInput === 'never'} />
                    <MainText>Dish is never {filterTitles[filter].toLowerCase()}</MainText>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => {
                  bottomRef.current.focus()
                  setTopInput('price')

                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.small }}>
                    <RadioButton on={topInput === 'price'} />
                    <MainText>Dish can be made {filterTitles[filter].toLowerCase()}</MainText>
                  </View>
                </TouchableOpacity>
              </View>

              <View style={{ minHeight: Layout.spacer.large }} />

              <LargeText center style={{ color: topInput !== 'price' ? Colors.darkgrey : Colors.softwhite }}>Is there an added cost to make it {filterTitles[filter].toLowerCase()}?</LargeText>
              <TouchableWithoutFeedback onPress={() => {
                if (topInput === 'price') {
                  bottomRef.current.focus()
                }
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginTop: Layout.spacer.small,
                  borderBottomColor: topInput !== 'price' ? Colors.darkgrey : Colors.softwhite,
                  borderBottomWidth: 2,
                  paddingBottom: 6,
                }}>
                  <View style={{ flex: 1 }} />
                  <HeaderText center style={{ color: topInput === 'price' ? Colors.softwhite : Colors.darkgrey }}>{centsToDollar(bottomInput || 0)}</HeaderText>
                  {bottomRef?.current?.isFocused() && <Cursor cursorOn />}
                  <View style={{ flex: 1 }}>
                    {!bottomInput && <HeaderText style={{ color: topInput === 'price' ? Colors.softwhite : Colors.darkgrey }}> (no charge)</HeaderText>}
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
                    // returnKeyType='done'
                    value={bottomInput.toString()}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>

            <View style={{ alignSelf: 'center', marginTop: Layout.spacer.medium }}>
              <MenuButton text='Confirm' color={topInput ? Colors.purple : Colors.darkgrey} minWidth buttonFn={() => navigation.navigate('Item', {
                filters: {
                  ...filters,
                  [filter]: topInput === 'always' ? true : topInput === 'price' ? parseInt(bottomInput || 0) : false
                }
              })} />
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
