import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  TextInput
} from 'react-native';
import Colors from '../utils/constants/Colors'
import Layout from '../utils/constants/Layout'
import MenuHeader from '../components/MenuHeader';
import DisablingScrollView from '../components/DisablingScrollview';
import firebase from '../config/Firebase';
import SafeView from '../utils/components/SafeView';
import StyledButton from '../utils/components/StyledButton';
import { MediumText, LargeText } from '../utils/components/NewStyledText';


const EMAIL_REGEX = /.+@.+\..+/

const logInErrors = {
  incomplete: 'incomplete',
  email_none: 'no',
  email_invalid: 'invalid',
  email_sent: 'sent',
  other: 'other',
}


export default function PasswordResetScreen({ navigation }) {
  const [email, setEmail] = useState('')
  const [submitError, setSubmitError] = useState(null)

  const [isEmailLike, setIsEmailLike] = useState(false)

  useEffect(() => {
    setIsEmailLike(email.match(EMAIL_REGEX))
  }, [email])

  const submit = async () => {
    setSubmitError(null)
    if (!email) {
      setTimeout(() => {
        setSubmitError(logInErrors.incomplete)
      }, submitError ? 100 : 0)

    }
    if (!isEmailLike) {
      setTimeout(() => {
        setSubmitError(logInErrors.email_invalid)
      }, submitError ? 100 : 0)

    }
    else {
      try {
        await firebase.auth().sendPasswordResetEmail(email)
        navigation.replace('LogIn', { reset: true })
      }
      catch (error) {
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
        else {
          setTimeout(() => {
            setSubmitError(logInErrors.other)
          }, submitError ? 100 : 0)
        }
      }
      // attempt reset
    }
  }

  return (
    <SafeView>
      <MenuHeader showLogo rightText='Log In' rightFn={() => { navigation.replace('LogIn') }} />
      <LargeText center style={{ marginTop: 24, }}>Forgot Password</LargeText>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, justifyContent: 'center', width: Layout.window.width * 0.8, alignSelf: 'center' }}>
        <DisablingScrollView center keyboardShouldPersistTaps='always'>
          <View>
            {!!submitError && <View style={{ position: 'absolute', left: 0, right: 0, top: -Layout.spacer.large }}>
              <LargeText center style={{ letterSpacing: 2, color: submitError === logInErrors.email_sent ? Colors.green : Colors.red, fontWeight: 'bold', }}>{submitError === logInErrors.incomplete ? 'MISSING FIELDS' : submitError === logInErrors.email_none ? 'INVALID EMAIL  FORMAT' : submitError === logInErrors.email_none ? 'EMAIL NOT FOUND' : 'ERROR WITH SUBMISSION'}</LargeText>
            </View>}
            <LargeText>Email address</LargeText>
            <MediumText>We'll send a password reset email to your inbox.</MediumText>
            <View style={{
              flexDirection: 'row',
              marginTop: Layout.spacer.small,
              borderBottomColor: email ? Colors.softwhite : Colors.lightgrey,
              borderBottomWidth: 2,
              paddingBottom: 3,
              paddingHorizontal: 4,

            }}>
              <TextInput
                autoCapitalize={'none'}
                autoCompleteType={'email'}
                autoCorrect={false}
                autoFocus
                blurOnSubmit={false}
                enablesReturnKeyAutomatically
                keyboardType='email-address'
                onChangeText={text => setEmail(text)}
                onSubmitEditing={() => {
                  if (isEmailLike) {
                    setSubmitError(null)
                  }
                  else {
                    setSubmitError(logInErrors.email_invalid)
                  }
                }}
                placeholder='janedoe@restaurant.com'
                placeholderTextColor={Colors.lightgrey}
                // returnKeyType='next'
                selectTextOnFocus
              >
                <MediumText>{email}</MediumText>
              </TextInput>
            </View>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: Layout.spacer.medium }}>
            <StyledButton text='Send reset email' color={isEmailLike ? Colors.purple : Colors.darkgrey} minWidth buttonFn={submit} />
          </View>

        </DisablingScrollView>
      </KeyboardAvoidingView>
    </SafeView>
  );
}

const styles = StyleSheet.create({
});
