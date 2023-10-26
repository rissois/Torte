import React, { useState, useRef, useEffect, } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import firebase from '../config/Firebase';
import useRestaurant from '../hooks/useRestaurant';

const nameErrors = {
  other: 'other'
}

export default function RestaurantNameScreen({ navigation, route }) {
  const restaurant_id = useRestaurant()
  const { name = '', address } = useSelector(state => state.restaurant)
  const [inputName, setInputName] = useState('')
  const [submitError, setSubmitError] = useState(null)
  const nameRef = useRef(null)

  useEffect(() => {
    setInputName(name)
  }, [name])

  useEffect(() => {
    setTimeout(() => nameRef.current.focus(), 100)
  }, [nameRef])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        {
          !!route?.params?.review ?
            <MenuHeader showLogo leftText='Back' leftFn={() => { navigation.goBack() }} /> :
            <MenuHeader showLogo rightText='1/5' />
        }

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, justifyContent: 'center', alignSelf: 'center', }}>
          <DisablingScrollView center keyboardShouldPersistTaps='always' contentContainerStyle={{ alignItems: 'center', }}>
            {!!submitError && <View style={{ position: 'absolute', left: 0, right: 0, top: -Layout.spacer.large }}>
              <LargeText style={{ letterSpacing: 2, textAlign: 'center', color: Colors.red, fontWeight: 'bold', }}>ERROR WITH SUBMISSION</LargeText>
            </View>}

            <View style={{ width: Layout.window.width * 0.7 }}>
              <LargeText shadow style={{ textAlign: 'center' }}>What is the name of your business?</LargeText>
              {/* <ClarifyingText style={{ textAlign: 'center' }}>We'll send a password reset restaurant to your inbox.</ClarifyingText> */}
              <View style={{
                flexDirection: 'row',
                marginTop: Layout.spacer.medium,
                borderBottomColor: inputName ? Colors.softwhite : Colors.lightgrey,
                borderBottomWidth: 2,
                paddingBottom: 6,
              }}>
                <TextInput
                  style={{
                    flex: 1,
                    fontSize: 34,
                    color: Colors.softwhite,
                    textAlign: 'center'
                  }}
                  autoCapitalize={'words'}
                  autoCompleteType={'off'}
                  autoCorrect={false}
                  blurOnSubmit={false}
                  enablesReturnKeyAutomatically
                  onChangeText={text => setInputName(text)}
                  // onSubmitEditing={() => {}}
                  placeholder='(business name)'
                  placeholderTextColor={Colors.lightgrey}
                  ref={nameRef}
                  returnKeyType='done'
                  value={inputName}
                />
              </View>
            </View>

            <View style={{ alignSelf: 'center', marginTop: Layout.spacer.medium }}>
              <MenuButton disabled={!inputName || !address} text={!address ? 'Initializing...' : route?.params?.review ? 'Save' : 'Continue'} color={inputName && address ? Colors.purple : Colors.darkgrey} minWidth buttonFn={async () => {
                setSubmitError(null)
                if (inputName === name) {
                  if (route?.params?.review) {
                    navigation.push('Review')
                  }
                  else {
                    navigation.navigate('Address')
                  }
                }
                else {
                  try {
                    await firebase.firestore().collection('restaurants').doc(restaurant_id).update({
                      name: inputName
                    })
                    if (route?.params?.review) {
                      navigation.push('Review')
                    }
                    else {
                      navigation.navigate('Address')
                    }
                  }
                  catch (error) {
                    console.log(error)
                    setTimeout(() => {
                      setSubmitError(nameErrors.other)
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
