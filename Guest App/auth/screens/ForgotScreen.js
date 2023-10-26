import React, { useState, useCallback } from 'react';
import auth from '@react-native-firebase/auth'


import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Animated,
  Keyboard,
  TouchableOpacity,
  Platform,
  TouchableWithoutFeedback, // Do not use react-native-gesture-handler, cannot style properly
} from 'react-native';

import { useFocusEffect, } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


import { DefaultText, SerifText, } from '../../utils/components/NewStyledText';

import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import SafeView from '../../utils/components/SafeView';




export default function ForgotScreen({ navigation }) {
  const failures = {
    incomplete: 'incomplete',
    email_non: 'not found',
    email_invalid: 'invalid',
    // success: 'success'
  }
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('')

  const [submitFailure, setSubmitFailure] = useState('')

  const [keyboardSpeed, setKeyboardSpeed] = useState(0)

  const [animatePadding] = useState(new Animated.Value(8))
  const [animateSize] = useState(new Animated.Value(64))

  const handleKeyboardListener = (event) => {
    Animated.parallel([
      Animated.timing(
        animatePadding,
        {
          toValue: event.android ? 0 : event.closeKeyboard ? 0 : event.endCoordinates.height - insets.bottom,
          duration: event.duration,
          useNativeDriver: false
        },
      ),
      Animated.timing(
        animateSize,
        {
          toValue: event.closeKeyboard ? 64 : 36,
          duration: event.duration,
          useNativeDriver: false
        },
      )
    ]).start()

    if (event.duration) {
      setKeyboardSpeed(event.duration)
    }
  }


  useFocusEffect(useCallback(() => {
    let showListener = Platform.OS === 'ios' ?
      Keyboard.addListener('keyboardWillShow', handleKeyboardListener) :
      Keyboard.addListener('keyboardDidShow', () => handleKeyboardListener({
        closeKeyboard: false,
        android: true,
        duration: 200,
      }))
    Keyboard.addListener('keyboardDidHide', () => handleKeyboardListener({
      closeKeyboard: true,
      android: true,
      duration: 200,
    }))

    return () => {
      showListener.remove()
    }
  }, []))

  return (
    <SafeView>
      {/* 
        DON'T FORGET TO CONSULT THE SPECIAL TEXTINPUT FIELDS YOU PULLED OUT SOMEWHERE
      */}
      <Animated.View style={{ flex: 1, alignItems: 'center', paddingBottom: animatePadding, marginVertical: 8 }}>
        <TouchableWithoutFeedback onPress={() => {
          Keyboard.dismiss()
          handleKeyboardListener({
            duration: keyboardSpeed,
            closeKeyboard: true,
          })
        }}>
          <View style={{ flex: 2, alignItems: 'center', alignSelf: 'stretch', }}>
            <SerifText style={{ position: 'absolute' }}>
              <Animated.Text maxFontSizeMultiplier={1.5} style={{
                transform: [{
                  translateY: animateSize.interpolate({
                    inputRange: [36, 64],
                    outputRange: [-(44 + insets.top + 24), 0]
                  })
                }],
              }}>Torte</Animated.Text>
            </SerifText>


            <View style={{ flex: 1, justifyContent: 'center' }}>
              <SerifText >
                <Animated.Text maxFontSizeMultiplier={1.2} numberOfLines={2} style={{ fontSize: animateSize, }}>Forgot Password</Animated.Text>
              </SerifText>
            </View>
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.form}>
          <Animated.Text maxFontSizeMultiplier={1.5} style={{
            color: Colors.red, fontSize: animateSize.interpolate({
              inputRange: [32, 64],
              outputRange: [16, 24]
            }),

          }}>{
              submitFailure === failures.incomplete ? 'Please enter an email' :
                submitFailure === failures.email_non ? 'Email not yet registered' :
                  submitFailure === failures.email_invalid ? 'Email is invalid' :
                    !!submitFailure ? submitFailure : ' '
            }</Animated.Text>

          <View style={styles.formRow}>
            <TextInput
              maxFontSizeMultiplier={1.5}
              style={styles.formText}
              placeholder='Email address'
              placeholderTextColor={Colors.lightgrey}
              autoCompleteType='email'
              autoCapitalize='none'
              autoCorrect={false}
              textContentType='emailAddress'
              keyboardType='email-address'
              keyboardAppearance='dark'
              returnKeyType='next'

              onChangeText={text => setEmail(text)}
            />
          </View>
        </View>
        <TouchableOpacity onPress={async () => {
          let failStatus = submitFailure
          setSubmitFailure(false)

          if (!email) {
            setTimeout(() => {
              setSubmitFailure(failures.incomplete)
            }, failStatus ? 100 : 0)
          }
          else {
            auth().sendPasswordResetEmail(email)//, actionCodeSettings)
              .then(() => {
                navigation.replace('LogIn', { resetEmail: true })
              })
              .catch(function (error) {
                if (error.code === 'auth/invalid-email') {
                  setTimeout(() => {
                    setSubmitFailure(failures.email_invalid)
                  }, failStatus ? 100 : 0)
                }
                else if (error.code === 'auth/user-not-found') {
                  setTimeout(() => {
                    setSubmitFailure(failures.email_non)
                  }, failStatus ? 100 : 0)
                }
              });
          }
        }}>
          <View style={styles.buttonView}>
            <Text maxFontSizeMultiplier={1.5} style={styles.butonText}>Send reset email</Text>
          </View>
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() => { navigation.navigate('Terms') }}>
            <FootnoteText style={{ color: Colors.white, }}>By continuing, you agree to our Terms and Condition</FootnoteText>
          </TouchableOpacity> */}
        <View style={{ flex: 1, justifyContent: 'flex-end', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => { navigation.replace('LogIn', { resetEmail: false }) }}>
            <DefaultText maxFontSizeMultiplier={1.7}>I know my password</DefaultText>
          </TouchableOpacity>

          <View style={{ height: 16 }} />

          <TouchableOpacity onPress={() => { navigation.replace('SignUp') }}>
            <DefaultText maxFontSizeMultiplier={1.7}>I don't have an account</DefaultText>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </SafeView>
  )
}

const styles = StyleSheet.create({
  form: {
  },
  formRow: {
    flexDirection: 'row',
    width: Layout.window.width * 0.8,
    borderBottomColor: Colors.white,
    borderBottomWidth: 2,
    paddingBottom: 4,
  },
  formText: {
    flex: 1,
    paddingTop: 16,
    color: Colors.white,
    fontSize: 22,
  },
  buttonView: {
    marginTop: 32,
    backgroundColor: Colors.purple,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 30,
    alignItems: 'center',
    justifyContent: 'center'
  },
  butonText: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '400'
  }
});