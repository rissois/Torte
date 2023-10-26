import React, { useState, useRef, useEffect, useCallback } from 'react';
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

import { MaterialIcons, } from '@expo/vector-icons';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import writeCreateUser from '../../transactions/writeCreateUser';
import { storeHavingLoggedIn } from '../functions/storeHavingLoggedIn';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import SafeView from '../../utils/components/SafeView';



/*
A NOTE ON ANONYMOUS LOGIN:
Anonymous login has been eliminated from current design,
  but it is worth retaining the code for now

Users can explore the app without logging in, and can even take their first photo.

User status is checked on two specific events:
  After entering a valid code (Home Screen)
  After submitting a valid photo for storage (Preview Screen)

Both events first collect the existing (code) or potential (scan) Firestore ID for the bill
  which is set into the store for later reference
This action triggers an effect on the requesting page
  which then checks a variable isApproved
This variable gates whether the user is already a non-anonymous user
  OR if the user elects to continue as a guest

Before a user elects this option, they are first shown an alert modal with 3 options:
  Exit and return home
  Continue as a guest
  Sign up / Log in

The alert modal received 4 props: 
(this has actually changed, the alert modal is now passed callbacks from the respective screens)
  props.navigation
  setUserAnonymousAlert: Responsible for displaying the modal on the requesting screen
  setIsApproved: Overrides an anonymous / unassigned user
  alertFrom: Tracks the name of the requesting screen through the sign in process

If the user exits: 
  the redux state bill_id is cleared
  the alert modal is hidden
  the stack is dismissed to return home

If the user continues as a guest:
  the alert modal is hidden
  isApproved is set to true
  
  > The requesting page anonymously signs in an unassigned user
  > Preview Screen only: Submits photo for storage and OCR
  > Navigates to next page
  
If the user asks to sign up or log in:
  navigate to SignUp
  passing in from: 'Alert and alertFrom

SignUp/LogIn are designed with different headers based on from param
NOTE: none of these headers are utilized in forced sign up version
  no from (i.e. initialization) displays a SKIP on the right
  'Home' displays a home icon to return to the Home Screen
  'Alert' displays a CANCEL on the left

A cancel returns to the requesting page
  where the alert modal is still active

If the user switches between SignUp and LogIn
  from and alertFrom are passed along

If the user successfully signs in
  If the alertFrom was set by param, it returns to the requesting page
  Otherwise, it navigates Home

The user logging in alters isAnonymous, which now sets isApproved
  the alert modal is closed

  > Preview Screen only: Submits photo for storage and OCR
  > Navigates to next page
*/




export default function SignUpScreen({ navigation }) {
  const failures = {
    incomplete: 'incomplete',
    short: 'short',
    email_used: 'used',
    email_invalid: 'invalid'
  }
  const insets = useSafeAreaInsets();

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const emailRef = useRef(null)
  const [password, setPassword] = useState('')
  const passwordRef = useRef(null)
  const [isPasswordHidden, setIsPasswordHidden] = useState(true)
  const [creatingUser, setCreatingUser] = useState(false)

  const [submitFailure, setSubmitFailure] = useState('')

  const [keyboardSpeed, setKeyboardSpeed] = useState(0)

  const [animatePadding] = useState(new Animated.Value(8))
  const [animateSize] = useState(new Animated.Value(64))

  // useEffect(() => {
  //   if (submitFailure) {
  //     let notice = setTimeout(() => {
  //       { setSubmitFailure(false) }
  //     }, 2000)
  //     return () => { clearTimeout(notice) }
  //   }
  // }, [submitFailure])

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

    const hideListener = Keyboard.addListener('keyboardDidHide', () => handleKeyboardListener({
      closeKeyboard: true,
      android: true,
      duration: 200,
    }))

    return () => {
      showListener.remove()
      hideListener.remove()
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
                }]
              }}>Torte</Animated.Text>
            </SerifText>
            <View style={{ flex: 2 }} />
            <SerifText>
              <Animated.Text maxFontSizeMultiplier={1.5} style={{ fontSize: animateSize, paddingVertical: 8 }}>Sign up</Animated.Text>
            </SerifText>
            <View style={{ flex: 1 }} />
          </View>
        </TouchableWithoutFeedback>

        <View style={styles.form}>
          <Animated.Text maxFontSizeMultiplier={1.5} style={{
            color: Colors.red, fontSize: animateSize.interpolate({
              inputRange: [32, 64],
              outputRange: [16, 24]
            }),

          }}>{
              submitFailure === failures.incomplete ? 'Missing fields' :
                submitFailure === failures.short ? 'Password too short' :
                  submitFailure === failures.email_used ? 'Email already used' :
                    submitFailure === failures.email_invalid ? 'Email is invalid' :
                      !!submitFailure ? submitFailure : ' '
            }</Animated.Text>
          <View style={styles.formRow}>
            <TextInput
              maxFontSizeMultiplier={1.5}
              style={styles.formText}
              placeholder='First and Last Name'
              placeholderTextColor={Colors.lightgrey}
              autoCompleteType='name'
              autoCapitalize='words'
              autoCorrect={false}
              textContentType='givenName'
              keyboardAppearance='dark'
              returnKeyType='next'

              onChangeText={text => setName(text)}
              // blurOnSubmit={false}
              onSubmitEditing={() => { emailRef.current.focus() }}
            />
          </View>

          <View style={styles.formRow}>
            <TextInput
              maxFontSizeMultiplier={1.5}
              ref={emailRef}
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
              // blurOnSubmit={false}
              onSubmitEditing={() => { passwordRef.current.focus() }}
            />
          </View>

          <View style={[styles.formRow, { alignItems: 'flex-end' }]}>
            <TextInput
              maxFontSizeMultiplier={1.5}
              ref={passwordRef}
              style={styles.formText}
              placeholder='Password'
              placeholderTextColor={Colors.lightgrey}
              autoCompleteType='off'
              autoCapitalize='none'
              autoCorrect={false}
              textContentType='password'
              keyboardAppearance='dark'
              returnKeyType='done'

              secureTextEntry={isPasswordHidden}
              onChangeText={text => setPassword(text)}
              onSubmitEditing={() => {
                handleKeyboardListener({
                  duration: keyboardSpeed,
                  closeKeyboard: true,
                })
              }}
            />

            <TouchableOpacity style={{}}
              onPress={() => {
                setIsPasswordHidden(!isPasswordHidden)
              }}
            >
              <MaterialIcons
                name={isPasswordHidden ? 'visibility-off' : 'visibility'}
                size={30}
                color={isPasswordHidden ? Colors.lightgrey : Colors.white}
              />
            </TouchableOpacity>
          </View>
          <DefaultText maxFontSizeMultiplier={1.7} style={{ marginTop: 8, color: failures.short ? Colors.red : Colors.white }}>Min. 8 characters</DefaultText>
        </View>
        <TouchableOpacity onPress={async () => {
          let failStatus = submitFailure
          setSubmitFailure(false)

          if (!name || !email || !password) {
            setTimeout(() => {
              setSubmitFailure(failures.incomplete)
            }, failStatus ? 100 : 0)
          }
          else if (password.length < 8) {
            setTimeout(() => {
              setSubmitFailure(failures.short)
            }, failStatus ? 100 : 0)
          }
          else {
            setCreatingUser(true)
            try {
              let response = await auth().createUserWithEmailAndPassword(email, password)
              await writeCreateUser(response.user.uid, name, email)
              storeHavingLoggedIn() // Await not necessary to risk failure
              response.user.updateProfile({ displayName: name })
              // response.user.sendEmailVerification()
            }
            catch (error) {
              if (error.code === 'auth/email-already-in-use') {
                setTimeout(() => {
                  setSubmitFailure(failures.email_used)
                }, failStatus ? 100 : 0)
              }
              else if (error.code === 'auth/invalid-email') {
                setTimeout(() => {
                  setSubmitFailure(failures.email_invalid)
                }, failStatus ? 100 : 0)
              }
              else {
                setTimeout(() => {
                  setSubmitFailure(error.code)
                }, failStatus ? 100 : 0)
              }
            }
            finally {
              setCreatingUser(false)
            }
          }
        }}>
          <View style={styles.buttonView}>
            <Text maxFontSizeMultiplier={1.5} style={styles.butonText}>Sign Up</Text>
          </View>
        </TouchableOpacity>
        {/* <TouchableOpacity onPress={() => { navigation.navigate('Terms') }}>
            <FootnoteText style={{ color: Colors.white, }}>By continuing, you agree to our Terms and Condition</FootnoteText>
          </TouchableOpacity> */}
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <TouchableOpacity onPress={() => { navigation.replace('LogIn') }}>
            <DefaultText maxFontSizeMultiplier={1.7}>Looking to log in?</DefaultText>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {creatingUser && <IndicatorOverlay text='Creating your account...' black />}
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
    marginTop: 16,
    backgroundColor: Colors.purple,
    borderRadius: 30,
    paddingVertical: 12,
    paddingHorizontal: 60,
    alignItems: 'center',
    justifyContent: 'center'
  },
  butonText: {
    color: Colors.white,
    fontSize: 28,
    fontWeight: '400'
  }
});