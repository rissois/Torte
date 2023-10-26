import React, { useState, useRef, useEffect, } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { MainText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import firebase from '../config/Firebase';
import useRestaurant from '../hooks/useRestaurant';

const STATE_REGEX = /^[a-zA-Z]{0,2}$/
const ZIP_REGEX = /^[0-9]{0,5}$/

const addressErrors = {
  incomplete: 'incomplete',
  state: 'state',
  zip: 'zip',
  other: 'other'
}

export const validAddress = ({ line1, city, state, zip }) => {
  return !!line1 && !!city && state.length === 2 && zip.length === 5
}

export default function AddressScreen({ navigation, route }) {
  const { address = {} } = useSelector(state => state.restaurant)
  const restaurant_id = useRestaurant()

  const [line1, setLine1] = useState('')
  const line1Ref = useRef(null)
  const [line2, setLine2] = useState('')
  const line2Ref = useRef(null)
  const [city, setCity] = useState('')
  const cityRef = useRef(null)
  const [state, setState] = useState('')
  const stateRef = useRef(null)
  const [zip, setZip] = useState('')
  const zipRef = useRef(null)

  const [widest, setWidest] = useState(null)

  const [submitError, setSubmitError] = useState(null)

  useEffect(() => {
    setLine1(curr => {
      if (!curr) return address.line1
      return curr
    })
    setLine2(curr => {
      if (!curr) return address.line2
      return curr
    })
    setCity(curr => {
      if (!curr) return address.city
      return curr
    })
    setState(curr => {
      if (!curr) return address.state
      return curr
    })
    setZip(curr => {
      if (!curr) return address.zip
      return curr
    })
  }, [address])

  useEffect(() => {
    setTimeout(() => line1Ref.current.focus(), 100)
  }, [line1Ref])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <MenuHeader showLogo leftText='Back' leftFn={() => { navigation.goBack() }} {...!route?.params?.review && { rightText: '2/5' }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, justifyContent: 'center', alignSelf: 'center', }}>
          <DisablingScrollView center keyboardShouldPersistTaps='always' contentContainerStyle={{ alignItems: 'center', }}>
            <View style={{ width: Layout.window.width * 0.7 }}>
              {!!submitError && <View style={{ position: 'absolute', left: 0, right: 0, top: -Layout.spacer.large }}>
                <LargeText style={{ textAlign: 'center', color: Colors.red, fontWeight: 'bold', letterSpacing: 2 }}>{submitError === addressErrors.incomplete ? 'MISSING FIELDS' : submitError === addressErrors.state ? 'INVALID STATE' : submitError === addressErrors.zip ? 'INVALID ZIPCODE' : 'ERROR WITH SUBMISSION'}</LargeText>
              </View>}
              <LargeText shadow style={{ textAlign: 'center' }}>What is the address of your business?</LargeText>
              <View style={{ marginTop: Layout.spacer.medium }}>
                <View style={styles.addressRow}>
                  <View style={{ width: widest }} onLayout={({ nativeEvent }) => {
                    setWidest(curr => {
                      if (curr < nativeEvent.layout.width) {
                        return nativeEvent.layout.width
                      }
                      return curr
                    })
                  }}>
                    <MainText>Line 1:</MainText>
                  </View>
                  <View style={[styles.addressInputView, { borderBottomColor: line1 ? Colors.softwhite : Colors.lightgrey }]}>
                    <TextInput
                      style={styles.addressInput}
                      autoCapitalize={'none'}
                      autoCompleteType={'street-address'}
                      autoCorrect={false}
                      enablesReturnKeyAutomatically
                      onChangeText={text => setLine1(text)}
                      onSubmitEditing={() => {
                        line2Ref.current.focus()
                      }}
                      placeholder='123 Orange Way'
                      placeholderTextColor={Colors.lightgrey}
                      returnKeyType='next'
                      value={line1}
                      ref={line1Ref}
                    />
                  </View>
                </View>

                <View style={{ marginTop: Layout.spacer.small }} />

                <View style={styles.addressRow}>
                  <View style={{ width: widest }} onLayout={({ nativeEvent }) => {
                    setWidest(curr => {
                      if (curr < nativeEvent.layout.width) {
                        return nativeEvent.layout.width
                      }
                      return curr
                    })
                  }}>
                    <MainText>Line 2:</MainText>
                  </View>
                  <View style={[styles.addressInputView, { borderBottomColor: line2 ? Colors.softwhite : Colors.lightgrey }]}>
                    <TextInput
                      style={styles.addressInput}
                      autoCapitalize={'none'}
                      autoCompleteType={'off'}
                      autoCorrect={false}
                      onChangeText={text => setLine2(text)}
                      onSubmitEditing={() => {
                        cityRef.current.focus()
                      }}
                      placeholder='(optional)'
                      placeholderTextColor={Colors.lightgrey}
                      ref={line2Ref}
                      returnKeyType='next'
                      value={line2}
                    />
                  </View>
                </View>

                <View style={{ marginTop: Layout.spacer.small }} />

                <View style={styles.addressRow}>
                  <View style={{ width: widest }} onLayout={({ nativeEvent }) => {
                    setWidest(curr => {
                      if (curr < nativeEvent.layout.width) {
                        return nativeEvent.layout.width
                      }
                      return curr
                    })
                  }}>
                    <MainText>City:</MainText>
                  </View>
                  <View style={[styles.addressInputView, { borderBottomColor: city ? Colors.softwhite : Colors.lightgrey }]}>
                    <TextInput
                      style={styles.addressInput}
                      autoCapitalize={'words'}
                      autoCompleteType={'off'}
                      autoCorrect={false}
                      enablesReturnKeyAutomatically
                      onChangeText={text => setCity(text)}
                      onSubmitEditing={() => {
                        stateRef.current.focus()
                      }}
                      placeholder='Your City'
                      placeholderTextColor={Colors.lightgrey}
                      ref={cityRef}
                      returnKeyType='next'
                      value={city}
                    />
                  </View>
                </View>

                <View style={{ marginTop: Layout.spacer.small }} />

                <View style={styles.addressRow}>
                  <View style={{ width: widest }} onLayout={({ nativeEvent }) => {
                    setWidest(curr => {
                      if (curr < nativeEvent.layout.width) {
                        return nativeEvent.layout.width
                      }
                      return curr
                    })
                  }}>
                    <MainText>State</MainText>
                  </View>
                  <View style={[styles.addressInputView, { borderBottomColor: state ? Colors.softwhite : Colors.lightgrey }]}>
                    <TextInput
                      style={styles.addressInput}
                      autoCapitalize={'characters'}
                      autoCompleteType={'off'}
                      autoCorrect={false}
                      enablesReturnKeyAutomatically
                      onChangeText={text => {
                        if (text.match(STATE_REGEX)) {
                          setState(text.toUpperCase())
                        }
                      }}
                      onSubmitEditing={() => {
                        zipRef.current.focus()
                      }}
                      placeholder='Two-Letter State (e.g. MI, NY, SC)'
                      placeholderTextColor={Colors.lightgrey}
                      ref={stateRef}
                      returnKeyType='next'
                      value={state}
                    />
                  </View>
                </View>

                <View style={{ marginTop: Layout.spacer.small }} />

                <View style={styles.addressRow}>
                  <View style={{ width: widest }} onLayout={({ nativeEvent }) => {
                    setWidest(curr => {
                      if (curr < nativeEvent.layout.width) {
                        return nativeEvent.layout.width
                      }
                      return curr
                    })
                  }}>
                    <MainText>Zip:</MainText>
                  </View>
                  <View style={[styles.addressInputView, { borderBottomColor: zip ? Colors.softwhite : Colors.lightgrey }]}>
                    <TextInput
                      style={styles.addressInput}
                      autoCapitalize={'none'}
                      autoCompleteType={'postal-code'}
                      autoCorrect={false}
                      enablesReturnKeyAutomatically
                      keyboardType='number-pad'
                      onChangeText={text => {
                        if (text.match(ZIP_REGEX)) {
                          setZip(text)
                        }
                      }}
                      onSubmitEditing={() => Keyboard.dismiss()}
                      placeholder='Five-Digit Zip Code'
                      placeholderTextColor={Colors.lightgrey}
                      ref={zipRef}
                      // returnKeyType='next'
                      value={zip}
                    />
                  </View>
                </View>
              </View>
            </View>

            <View style={{ alignSelf: 'center', marginTop: Layout.spacer.medium }}>
              <MenuButton text={route?.params?.review ? 'Save' : 'Continue'} color={validAddress({ line1, line2, city, state, zip }) ? Colors.purple : Colors.darkgrey} minWidth buttonFn={async () => {
                setSubmitError(null)
                if (!line1 || !city) {
                  setTimeout(() => {
                    setSubmitError(addressErrors.incomplete)
                  }, submitError ? 100 : 0)
                }
                else if (state.length !== 2 || !state.match(STATE_REGEX)) {
                  setTimeout(() => {
                    setSubmitError(addressErrors.state)
                  }, submitError ? 100 : 0)
                }
                else if (zip.length !== 5 || !zip.match(ZIP_REGEX)) {
                  setTimeout(() => {
                    setSubmitError(addressErrors.zip)
                  }, submitError ? 100 : 0)
                }
                else if (!~Object.keys(address).findIndex(key => address[key] !== eval(key))) {
                  // No need to write if no change to address
                  navigation.navigate('Phone')
                }
                else {
                  try {
                    await firebase.firestore().collection('restaurants').doc(restaurant_id).update({
                      address: {
                        line1,
                        line2,
                        city,
                        state,
                        zip
                      }
                    })
                    if (route?.params?.review) {
                      navigation.push('Review')
                    }
                    else {
                      navigation.navigate('Phone')
                    }
                  }
                  catch (error) {
                    console.log(error)
                    setTimeout(() => {
                      setSubmitError(addressErrors.other)
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
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  addressInputView: {
    flex: 1,
    borderBottomWidth: 2,
    paddingBottom: 3,
    paddingHorizontal: 6,
    marginLeft: Layout.spacer.small
  },
  addressInput: {
    fontSize: 24,
    color: Colors.softwhite,
  }

});
