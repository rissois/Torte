import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  TouchableOpacity,
  TextInput,
  Alert
} from 'react-native';
import Colors from '../utils/constants/Colors'
import Layout from '../utils/constants/Layout'
import MenuHeader from '../components/MenuHeader';
import DisablingScrollView from '../components/DisablingScrollview';
import { MaterialIcons, } from '@expo/vector-icons';
import firebase from '../config/Firebase';
import SafeView from '../utils/components/SafeView';
import IndicatorOverlay from '../utils/components/IndicatorOverlay';
import StyledButton from '../utils/components/StyledButton';
import * as MailComposer from 'expo-mail-composer';

import { MediumText, LargeText, ExtraLargeText } from '../utils/components/NewStyledText';
import TorteGradientLogo from '../components/TorteGradientLogo';

const EMAIL_REGEX = /.+@.+\..+/

const logInErrors = {
  incomplete: 'incomplete',
  password_wrong: 'pw',
  email_none: 'no',
  email_invalid: 'invalid',
  other: 'other',
  email_sent: 'sent',
}


export default function LoginScreen({ navigation, route }) {
  const [email, setEmail] = useState('')
  const passwordRef = useRef(null)
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const [greyPassword, setGreyPassword] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [submitError, setSubmitError] = useState('')

  const [isEmailLike, setIsEmailLike] = useState(false)

  const [loggingIn, setLoggingIn] = useState(false)

  useEffect(() => { setSubmitError(route?.params?.reset ? logInErrors.email_sent : '') }, [])

  useEffect(() => {
    setIsEmailLike(email.match(EMAIL_REGEX))
  }, [email])

  useEffect(() => {
    setGreyPassword(isEmailLike || password || passwordFocused ? null : { style: { color: Colors.darkgrey } })
  }, [isEmailLike, password, passwordFocused])

  const submit = async () => {
    setSubmitError(null)
    if (!email || !password) {
      setTimeout(() => {
        setSubmitError(logInErrors.incomplete)
      }, submitError ? 100 : 0)

    }
    if (!isEmailLike) {
      setTimeout(() => {
        setSubmitError(logInErrors.email_invalid)
      }, submitError ? 100 : 0)

    }
    else if (password.length < 8) {
      setTimeout(() => {
        setSubmitError(logInErrors.short)
      }, submitError ? 100 : 0)
    }
    else {
      // attempt log in
      setLoggingIn(true)
      try {
        await firebase.auth().signInWithEmailAndPassword(email, password)
      }
      catch (error) {
        console.log('Log In Error: ', error)
        if (error.code === 'auth/invalid-email') {
          setTimeout(() => {
            setSubmitError(logInErrors.email_invalid)
          }, submitError ? 100 : 0)
        }
        else if (error.code === 'auth/user-not-found') {
          setTimeout(() => {
            setSubmitError(logInErrors.email_none)
          }, submitError ? 100 : 0)
        }
        else if (error.code === 'auth/wrong-password') {
          setTimeout(() => {
            setSubmitError(logInErrors.password_wrong)
          }, submitError ? 100 : 0)
        }
        else {
          setTimeout(() => {
            setSubmitError(logInErrors.other)
          }, submitError ? 100 : 0)
        }
      }
      finally {
        setLoggingIn(false)
      }

      // 
    }
  }

  return (
    <SafeView>
      <View>
        <TorteGradientLogo size={Layout.window.height * 0.07} />
        <View style={{ marginTop: 10 }}>
          <ExtraLargeText center style={{ marginVertical: 10 }}>New to Torte?</ExtraLargeText>
          <LargeText center>Reach out and we will get you started!</LargeText>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 8 }}>
            <MaterialIcons name='email' size={24} color={Colors.white} style={{ marginRight: 8 }} />
            <TouchableOpacity onPress={async () => {
              let response = await MailComposer.composeAsync({
                recipients: ['support@tortepay.com'],
                subject: 'Enroll with Torte'
              }).catch(error => Alert.alert('Cannot open email app', 'Sorry, please send an email to support@tortepay.com'))
            }}>
              <MediumText center style={{ color: Colors.green }}>support@tortepay.com</MediumText>
            </TouchableOpacity>
            <View style={{ width: 40 }} />
            <MaterialIcons name='phone' size={24} color={Colors.white} style={{ marginRight: 8 }} />
            <MediumText center >248.891.4781</MediumText>
          </View>
        </View>
      </View>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, justifyContent: 'center', width: Layout.window.width * 0.8, alignSelf: 'center' }}>
        <DisablingScrollView center keyboardShouldPersistTaps='always'>
          <View>
            {!!submitError && <View style={{ position: 'absolute', left: 0, right: 0, top: -Layout.spacer.large }}>
              <ExtraLargeText center style={{ letterSpacing: 2, color: submitError === logInErrors.email_sent ? Colors.green : Colors.red, fontWeight: 'bold', }}>{submitError === logInErrors.incomplete ? 'MISSING FIELDS' : submitError === logInErrors.email_invalid ? 'INVALID EMAIL  FORMAT' : submitError === logInErrors.email_none ? 'EMAIL NOT FOUND' : submitError === logInErrors.password_wrong ? 'WRONG PASSWORD' : submitError === logInErrors.email_sent ? 'PASSWORD RESET EMAIL SENT' : 'ERROR WITH SUBMISSION'}</ExtraLargeText>
            </View>}
            <LargeText>Email address</LargeText>
            <View style={{
              flexDirection: 'row',
              marginTop: Layout.spacer.small,
              borderBottomColor: email ? Colors.white : Colors.lightgrey,
              borderBottomWidth: 2,
              paddingBottom: 3,
            }}>
              <TextInput
                style={{ flex: 1 }}
                autoCapitalize={'none'}
                autoCompleteType={'email'}
                autoCorrect={false}
                autoFocus
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
                    setSubmitError(logInErrors.email_invalid)
                  }
                }}
                placeholder='janedoe@restaurant.com'
                placeholderTextColor={Colors.lightgrey}
                returnKeyType='next'
                selectTextOnFocus
              >
                <MediumText>{email}</MediumText>
              </TextInput>
            </View>
          </View>

          <View style={{ minHeight: Layout.spacer.medium }} />

          <View>
            <LargeText {...greyPassword}>Password</LargeText>
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              marginTop: Layout.spacer.small,
              borderBottomColor: greyPassword ? Colors.darkgrey : password ? Colors.white : Colors.lightgrey,
              borderBottomWidth: 2,
              paddingBottom: 3,
              paddingHorizontal: 4,
            }}>
              <TextInput
                style={{
                  flex: 1,
                  color: greyPassword ? Colors.darkgrey : Colors.white
                }}
                autoCapitalize={'none'}
                autoCompleteType={'password'}
                autoCorrect={false}
                blurOnSubmit={false}
                editable={!greyPassword}
                enablesReturnKeyAutomatically
                onChangeText={text => setPassword(text)}
                onSubmitEditing={() => Keyboard.dismiss()}
                placeholder='(enter a password)'
                placeholderTextColor={greyPassword ? Colors.darkgrey : Colors.lightgrey}
                ref={passwordRef}
                // returnKeyType='done'
                secureTextEntry={!isPasswordVisible}
                selectTextOnFocus
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              >
                <MediumText darkgrey={!!greyPassword}>{password}</MediumText>
              </TextInput>
              <TouchableOpacity onPress={() => setIsPasswordVisible(prev => !prev)}>
                <MaterialIcons name={greyPassword ? 'visibility-off' : 'visibility'} size={24} color={greyPassword ? Colors.darkgrey : isPasswordVisible ? Colors.white : Colors.lightgrey} style={{ paddingHorizontal: 12 }} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: Layout.spacer.medium }}>
            <TouchableOpacity onPress={() => { navigation.replace('PasswordReset') }}>
              <MediumText>Forgot password</MediumText>
            </TouchableOpacity>
            <StyledButton text='Log In' color={isEmailLike && password.length >= 8 ? Colors.purple : Colors.darkgrey} minWidth onPress={submit} />
          </View>

        </DisablingScrollView>
      </KeyboardAvoidingView>
      {loggingIn && <IndicatorOverlay text='Logging in...' />}
    </SafeView>
  );
}

const styles = StyleSheet.create({
});
