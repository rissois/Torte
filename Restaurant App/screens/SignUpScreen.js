import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Colors from '../utils/constants/Colors'
import Layout from '../utils/constants/Layout'
import DisablingScrollView from '../components/DisablingScrollview';
import { MaterialIcons, } from '@expo/vector-icons';

import firebase from 'firebase';
import IndicatorOverlay from '../utils/components/IndicatorOverlay';
import SafeView from '../utils/components/SafeView';
import StyledButton from '../utils/components/StyledButton';
import { MediumText, LargeText, ExtraLargeText } from '../utils/components/NewStyledText';
import Header from '../utils/components/Header';
import TorteGradientLogo from '../components/TorteGradientLogo';
import { useDispatch } from 'react-redux';
import { doAppReset } from '../redux/actions/actionsApp';
import { doAllStart } from '../redux/actions/actionsAll';

const EMAIL_REGEX = /.+@.+\..+/

const signUpErrors = {
  incomplete: 'incomplete',
  short: 'short',
  email_used: 'used',
  email_invalid: 'invalid',
  other: 'other',
}

export default function SignUpScreen({ navigation }) {
  const dispatch = useDispatch()
  const [name, setName] = useState('')

  const emailRef = useRef(null)
  const [email, setEmail] = useState('')
  const [isEmailLike, setIsEmailLike] = useState(false)
  const [emailFocused, setEmailFocused] = useState(false)

  const passwordRef = useRef(null)
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)


  const [submitError, setSubmitError] = useState(null)


  const [creatingRestaurant, setCreatingRestaurant] = useState(false)

  useEffect(() => {
    setIsEmailLike(email.match(EMAIL_REGEX))
  }, [email])

  const submit = async () => {
    setSubmitError(null)
    if (!email || !password) {
      setTimeout(() => {
        setSubmitError(signUpErrors.incomplete)
      }, submitError ? 100 : 0)

    }
    if (!isEmailLike) {
      setTimeout(() => {
        setSubmitError(signUpErrors.email_invalid)
      }, submitError ? 100 : 0)

    }
    else if (password.length < 8) {
      setTimeout(() => {
        setSubmitError(signUpErrors.short)
      }, submitError ? 100 : 0)
    }
    else {
      // attempt registration
      setCreatingRestaurant(true)
      try {
        const { data: { restaurant_id } } = await firebase.functions().httpsCallable('restaurant-createRestaurant')({
          name,
          email,
          password
        })

        if (restaurant_id) {
          dispatch(doAppReset())
          dispatch(doAllStart(restaurant_id))
          navigation.navigate('Dashboard')
        }
      }
      catch (error) {
        console.log('Sign In Error: ', error)
        if (error.code === 'auth/email-already-in-use') {
          setTimeout(() => {
            setSubmitError(signUpErrors.email_used)
          }, submitError ? 100 : 0)
        }
        else if (error.code === 'auth/invalid-email') {
          setTimeout(() => {
            setSubmitError(signUpErrors.email_invalid)
          }, submitError ? 100 : 0)
        }
        else {
          setTimeout(() => {
            setSubmitError(signUpErrors.other)
          }, submitError ? 100 : 0)
        }
      }
      finally {
        setCreatingRestaurant(false)
      }
    }
  }

  // const headerRight = <TouchableOpacity onPress={() => {
  //   Keyboard.dismiss()
  //   navigation.replace('LogIn')
  // }}>
  //   <MediumText>Log in?</MediumText>
  // </TouchableOpacity>

  return (
    <SafeView>
      {/* <Header right={headerRight}>
        <View style={{ alignItems: 'center' }}>
          <TorteGradientLogo size={40} />
          <LargeText>Sign Up</LargeText>
        </View>
      </Header> */}
      <Header back alignStart>
        <TorteGradientLogo size={Layout.window.height * 0.07} />
        <ExtraLargeText center>Sign up</ExtraLargeText>
      </Header>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, justifyContent: 'center', width: Layout.window.width * 0.8, alignSelf: 'center' }}>
        <DisablingScrollView center keyboardShouldPersistTaps='always'>
          <View>
            {!!submitError && <View style={{ position: 'absolute', left: 0, right: 0, top: -Layout.spacer.large }}>
              <LargeText center style={{ letterSpacing: 2, textAlign: 'center', color: Colors.red, fontWeight: 'bold', }}>{submitError === signUpErrors.incomplete ? 'MISSING FIELDS' : submitError === signUpErrors.email_invalid ? 'INVALID EMAIL FORMAT' : submitError === signUpErrors.short ? 'PASSWORD TOO SHORT' : submitError === signUpErrors.email_used ? 'EMAIL ALREADY USED' : 'ERROR WITH SUBMISSION'}</LargeText>
            </View>}
            <LargeText>What is the name of your restaurant?</LargeText>
            <View style={{
              flexDirection: 'row',
              marginTop: Layout.spacer.small,
              borderBottomColor: name ? Colors.white : Colors.lightgrey,
              borderBottomWidth: 1,
              paddingBottom: 3,
              paddingHorizontal: 4
            }}>
              <TextInput
                style={{ flex: 1 }}
                autoCorrect={false}
                autoFocus
                blurOnSubmit={false}
                enablesReturnKeyAutomatically
                onChangeText={setName}
                onSubmitEditing={() => {
                  emailRef.current.focus()
                }}
                placeholder='The Brown Jug'
                placeholderTextColor={Colors.lightgrey}
                returnKeyType='next'
                selectTextOnFocus
              >
                <MediumText>{name}</MediumText>
              </TextInput>
            </View>
          </View>

          <View style={{ minHeight: Layout.spacer.medium }} />

          <View opacity={name || email || emailFocused ? 1 : 0.15}>
            <LargeText>What email address will you use?</LargeText>
            <MediumText>Used to log in and for communication with Torte</MediumText>
            <View style={{
              flexDirection: 'row',
              marginTop: Layout.spacer.small,
              borderBottomColor: email ? Colors.white : Colors.lightgrey,
              borderBottomWidth: 1,
              paddingBottom: 3,
              paddingHorizontal: 4
            }}>
              <TextInput
                style={{ flex: 1, }}
                autoCapitalize={'none'}
                autoCompleteType={'email'}
                autoCorrect={false}
                blurOnSubmit={false}
                enablesReturnKeyAutomatically
                keyboardType='email-address'
                onChangeText={setEmail}
                onSubmitEditing={() => {
                  if (isEmailLike) {
                    setSubmitError(null)
                    passwordRef.current.focus()
                  }
                  else {
                    setSubmitError(signUpErrors.email_invalid)
                  }
                }}
                placeholder='janedoe@restaurant.com'
                placeholderTextColor={Colors.lightgrey}
                ref={emailRef}
                returnKeyType='next'
                selectTextOnFocus
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              >
                <MediumText>{email}</MediumText>
              </TextInput>
            </View>
          </View>

          <View style={{ minHeight: Layout.spacer.medium }} />

          <View opacity={(name && isEmailLike) || password || passwordFocused ? 1 : 0.15}>
            <LargeText>What password will you use?</LargeText>
            <MediumText>Must be at least 8 characters. Keep this safe!</MediumText>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: Layout.spacer.small,
              borderBottomColor: password ? Colors.white : Colors.lightgrey,
              borderBottomWidth: 1,
              paddingBottom: 3,
              paddingHorizontal: 4
            }}>
              <TextInput
                style={{ flex: 1, }}
                autoCapitalize={'none'}
                autoCompleteType={'password'}
                autoCorrect={false}
                blurOnSubmit={false}
                enablesReturnKeyAutomatically
                onChangeText={setPassword}
                onSubmitEditing={() => Keyboard.dismiss()}
                placeholder='(enter a password)'
                placeholderTextColor={Colors.lightgrey}
                ref={passwordRef}
                // returnKeyType='done'
                secureTextEntry={!isPasswordVisible}
                selectTextOnFocus
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              >
                <MediumText>{password}</MediumText>
              </TextInput>
              <TouchableOpacity onPress={() => setIsPasswordVisible(prev => !prev)}>
                <MaterialIcons name={isPasswordVisible ? 'visibility-off' : 'visibility'} size={24} color={isPasswordVisible ? Colors.white : Colors.lightgrey} style={{ paddingHorizontal: 12 }} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: Layout.spacer.medium }}>
            <StyledButton text='Create account' color={name && isEmailLike && password.length >= 8 ? Colors.purple : Colors.darkgrey} onPress={submit} />
          </View>

        </DisablingScrollView>
      </KeyboardAvoidingView>
      {creatingRestaurant && <IndicatorOverlay text='Creating account...' />}
    </SafeView>
  );
}

const styles = StyleSheet.create({
});
