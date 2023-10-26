import React, { useState, useRef, useEffect, } from 'react';
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
import { TextInput, TouchableWithoutFeedback, } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import firebase from '../config/Firebase';
import Cursor from '../components/Cursor';
import useRestaurant from '../hooks/useRestaurant';

const NUMBERS_REGEX = /^[0-9]{0,10}$/
const phoneErrors = {
  missing_guest: 'mg',
  small_guest: 'sg',
  small_torte: 'st',
  missing_torte: 'mt',
  other: 'other'
}

export const formatPhoneNumber = (number) => {
  if (!number) {
    return null
  }

  let formatted = '(' + number.substring(0, 3) + ')'
  if (number.length > 3) {
    formatted += ' ' + number.substring(3, 6)
    if (number.length > 6) {
      formatted += '-' + number.substring(6, 10)
    }
  }

  return formatted
}

export default function PhoneScreen({ navigation, route }) {
  const restaurant_id = useRestaurant()
  const { phone_number = '' } = useSelector(state => state.restaurant)
  const { private: p = {} } = useSelector(state => state.privateDocs)
  const { private_phone_number = '' } = p
  const [guestPhone, setGuestPhone] = useState('')
  const guestPhoneRef = useRef(null)
  const [guestPhoneFocused, setGuestPhoneFocused] = useState(false)
  const [managementPhone, setManagementPhone] = useState('')
  const managementPhoneRef = useRef(null)
  const [greyManagement, setGreyMangement] = useState(null)
  const [managementPhoneFocused, setManagementPhoneFocused] = useState(false)
  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    setGuestPhone(phone_number)
    setManagementPhone(private_phone_number)
  }, [phone_number, private_phone_number])

  useEffect(() => {
    setGreyMangement(guestPhone.length === 10 || managementPhone || managementPhoneFocused ? null : { color: Colors.darkgrey })
  }, [guestPhone, managementPhone, managementPhoneFocused])

  useEffect(() => {
    setTimeout(() => guestPhoneRef.current.focus(), 100)
  }, [guestPhoneRef])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <MenuHeader showLogo leftText='Back' leftFn={() => { navigation.goBack() }} {...!route?.params?.review && { rightText: '3/5' }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, justifyContent: 'center', alignSelf: 'center', }}>
          <DisablingScrollView center keyboardShouldPersistTaps='always' contentContainerStyle={{ alignItems: 'center', }}>
            {!!submitError && <View style={{ position: 'absolute', left: 0, right: 0, top: -Layout.spacer.large }}>
              <LargeText style={{ letterSpacing: 2, textAlign: 'center', color: Colors.red, fontWeight: 'bold', }}>{submitError === phoneErrors.missing_guest ? 'PLEASE ADD GUEST NUMBER' : submitError === phoneErrors.small_guest ? 'GUEST # MUST BE 10 DIGITS' : submitError === phoneErrors.small_torte ? 'MGMT # MUST BE 10 DIGITS' : submitError === phoneErrors.missing_torte ? 'PLEASE ADD MANAGEMENT NUMBER' : 'ERROR WITH SUBMISSION'}</LargeText>
            </View>}
            <View style={{ width: Layout.window.width * 0.7 }}>
              <MainText style={{ textAlign: 'center' }}>What is the phone number for your business?</MainText>
              <ClarifyingText style={{ textAlign: 'center' }}>This is the public number you have on your website in case your guests need to reach you.</ClarifyingText>
              <TouchableWithoutFeedback onPress={() => {
                guestPhoneRef.current.focus()
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginTop: Layout.spacer.small,
                  borderBottomColor: guestPhone ? Colors.softwhite : Colors.lightgrey,
                  borderBottomWidth: 2,
                  paddingBottom: 6,
                }}>

                  <HeaderText style={{ textAlign: 'center', ...!guestPhone && { color: Colors.lightgrey } }}>{guestPhone ? formatPhoneNumber(guestPhone) : '(XXX) XXX-XXXX'}</HeaderText>
                  <Cursor cursorOn={guestPhoneFocused} />
                  <TextInput
                    style={{ height: 0, width: 0, color: Colors.backgroundColor }}
                    blurOnSubmit={false}
                    enablesReturnKeyAutomatically
                    selectTextOnFocus
                    keyboardType='number-pad'
                    onChangeText={text => {
                      if (text.match(NUMBERS_REGEX)) {
                        setGuestPhone(text)
                        if (text.length === 10 && !managementPhone) {
                          managementPhoneRef.current.focus()
                        }
                      }
                    }}
                    ref={guestPhoneRef}
                    returnKeyType='next'
                    value={guestPhone}
                    onFocus={() => setGuestPhoneFocused(true)}
                    onBlur={() => setGuestPhoneFocused(false)}
                  />
                </View>
              </TouchableWithoutFeedback>

              <View style={{ minHeight: Layout.spacer.medium }} />

              <MainText style={{ textAlign: 'center', ...greyManagement }}>What is your management contact number?</MainText>
              <ClarifyingText style={{ textAlign: 'center', ...greyManagement }}>This is the number Torte will call if we are responding to a support claim or we need to reach you.</ClarifyingText>
              <TouchableWithoutFeedback onPress={() => {
                managementPhoneRef.current.focus()
              }}>
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  marginTop: Layout.spacer.small,
                  borderBottomColor: greyManagement ? Colors.darkgrey : managementPhone ? Colors.softwhite : Colors.lightgrey,
                  borderBottomWidth: 2,
                  paddingBottom: 6,
                }}>

                  <HeaderText style={{ textAlign: 'center', color: managementPhone ? Colors.white : Colors.lightgrey, ...greyManagement }}>{managementPhone ? formatPhoneNumber(managementPhone) : '(XXX) XXX-XXXX'}</HeaderText>
                  <Cursor cursorOn={managementPhoneFocused} />
                  <TextInput
                    style={{ height: 0, width: 0, color: Colors.backgroundColor }}
                    blurOnSubmit={false}
                    enablesReturnKeyAutomatically
                    selectTextOnFocus
                    keyboardType='number-pad'
                    onChangeText={text => {
                      if (text.match(NUMBERS_REGEX)) {
                        setManagementPhone(text)
                      }
                    }}
                    ref={managementPhoneRef}
                    // returnKeyType='done'
                    value={managementPhone}
                    onFocus={() => setManagementPhoneFocused(true)}
                    onBlur={() => setManagementPhoneFocused(false)}
                  />
                </View>
              </TouchableWithoutFeedback>
            </View>

            <View style={{ alignSelf: 'center', marginTop: Layout.spacer.medium }}>
              <MenuButton text={route?.params?.review ? 'Save' : 'Continue'} color={guestPhone.length === 10 && managementPhone.length === 10 ? Colors.purple : Colors.darkgrey} minWidth buttonFn={async () => {
                setSubmitError(null)
                if (guestPhone.length !== 10) {
                  setTimeout(() => {
                    setSubmitError(guestPhone ? phoneErrors.small_guest : phoneErrors.missing_guest)
                  }, submitError ? 100 : 0)
                }
                else if (managementPhone.length !== 10) {
                  setTimeout(() => {
                    setSubmitError(managementPhone ? phoneErrors.small_torte : phoneErrors.missing_torte)
                  }, submitError ? 100 : 0)
                }
                else {
                  try {
                    var batch = firebase.firestore().batch()
                    if (guestPhone !== phone_number) {
                      let restaurantRef = firebase.firestore().collection('restaurants').doc(restaurant_id)
                      batch.update(restaurantRef, {
                        phone_number: guestPhone
                      })
                    }
                    if (managementPhone !== private_phone_number) {
                      let privateRef = firebase.firestore().collection('restaurants').doc(restaurant_id).collection('restaurantPrivate').doc('private')
                      batch.update(privateRef, {
                        private_phone_number: managementPhone
                      })
                    }

                    await batch.commit()

                    if (route?.params?.review) {
                      navigation.push('Review')
                    }
                    else {
                      navigation.navigate('Logo')
                    }
                  }
                  catch (error) {
                    console.log(error)
                    setTimeout(() => {
                      setSubmitError(phoneErrors.other)
                    }, submitError ? 100 : 0)
                  }
                }
              }} />
            </View>

          </DisablingScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View >
  );
}

const styles = StyleSheet.create({
});
