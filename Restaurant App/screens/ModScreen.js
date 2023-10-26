import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Alert,
  Platform,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import firebase from '../config/Firebase';
import { TextInput, TouchableWithoutFeedback, TouchableOpacity } from 'react-native-gesture-handler';
import Cursor from '../components/Cursor';
import centsToDollar from '../functions/centsToDollar';
import { removeTracker } from '../redux/actionsTracker';
import { MaterialIcons, } from '@expo/vector-icons';
import useRestaurant from '../hooks/useRestaurant';

export default function ModScreen({ navigation, route }) {
  const restaurant_id = useRestaurant()
  const dispatch = useDispatch()
  const { tracker: { modification: mod_id }, tracker, modifications = {}, items = {} } = useSelector(state => state)
  let { [mod_id]: modData = {} } = modifications
  // console.log(mod_id)
  let { name = '', price = 0, max: fsMax = 1 } = modData
  // Not actually necessary... you could just do a param and if no param then you know it's new
  const [topInput, setTopInput] = useState(name)
  const [bottomInput, setBottomInput] = useState(price)
  const bottomRef = useRef(null)
  const [bottomFocused, setBottomFocused] = useState(false)
  const [max, setMax] = useState(fsMax)
  const [submitError, setSubmitError] = useState(null)
  const [alteredMod, setAlteredMod] = useState(false)

  let { params = {} } = route

  useEffect(() => {
    setAlteredMod(name !== topInput || price !== bottomInput || fsMax !== max)
  }, [topInput, bottomInput, max])

  const updateOrCreate = async () => {
    if (mod_id) {
      try {
        if (alteredMod) {
          firebase.firestore().collection('restaurants').doc(restaurant_id)
            .collection('restaurantModifications').doc(mod_id)
            .update({
              name: topInput,
              price: bottomInput,
              max,
            })
        }
        dispatch(removeTracker('modification'))
        navigation.goBack()
      }
      catch (error) {
        console.log('updateOrCreate mod_id error: ', error)
      }
    }
    else { // Create a new doc
      try {
        var batch = firebase.firestore().batch()

        let collectionRef = firebase.firestore().collection('restaurants').doc(restaurant_id).collection('restaurantModifications')
        let docRef = collectionRef.doc()

        if (tracker.item) {
          let parentRef = firebase.firestore().collection('restaurants').doc(restaurant_id).collection('restaurantItems').doc(tracker.item)
          batch.update(parentRef, {
            modOrder: firebase.firestore.FieldValue.arrayUnion(docRef.id)
          })
        }

        batch.set(docRef, {
          name: topInput,
          price: bottomInput,
          max,
          live: true,
        })

        // can await
        await batch.commit()

        if (tracker.item) {
          navigation.navigate('Item', { new_mod: docRef.id })
        }
        else {
          navigation.goBack()
        }
      }
      catch (error) {
        console.log('updateOrCreate errro: ', error)
        setSubmitError(true)
        Alert.alert('Could not save add-on', 'Please try again. Contact Torte support if the issue persists.')
      }
    }
  }

  const goBack = (home) => {
    if ((!mod_id && topInput) ||
      (mod_id && modData.name !== topInput && modData.price !== bottomInput)) {
      Alert.alert('Unsaved ' + (mod_id ? 'changes' : 'add-on'), 'Do you want to ' + (mod_id ? 'keep these changes' : 'save this add-on') + '?', [
        {
          text: 'Yes',
          onPress: () => {
            updateOrCreate()
          }
        },
        {
          text: 'No, go back',
          onPress: () => {
            dispatch(removeTracker('modification'))
            navigation.goBack()
          },
        },
        {
          text: 'Cancel',
          style: "cancel"
        },

      ])
    }
    else {
      dispatch(removeTracker('modification'))
      navigation.goBack()
    }
  }


  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <MenuHeader leftText='Back' leftFn={() => { goBack() }}
        />

        {items.hasOwnProperty(tracker.item) && <HeaderText center>{params.item_name ?? items[tracker.item].name}</HeaderText>}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, justifyContent: 'center', width: Layout.window.width * 0.8, alignSelf: 'center' }}>
          <DisablingScrollView center keyboardShouldPersistTaps='always'>
            <View style={{}}>
              {!!submitError && <View style={{ position: 'absolute', left: 0, right: 0, top: -Layout.spacer.large }}>
                <LargeText style={{ letterSpacing: 2, textAlign: 'center', color: Colors.red, fontWeight: 'bold', }}>ERROR WITH SUBMISSION</LargeText>
              </View>}
              <LargeText style={{ textAlign: 'center' }}>What is the name of the add-on?</LargeText>
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
              <LargeText center style={{ ...!topInput && { color: Colors.darkgrey } }}>What is the price of the add-on?</LargeText>
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
              <LargeText center style={{ ...!topInput && { color: Colors.darkgrey } }}>Can users request 2X, 3X, etc.?</LargeText>
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
              <MenuButton text='Discard changes' color={alteredMod ? Colors.red : Colors.darkgrey} buttonFn={() => {
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

              }} disabled={!alteredMod} />
              <MenuButton text={max < 1 ? 'Max too low' : alteredMod ? 'Save changes' : 'No changes'} color={alteredMod && topInput && max > 0 ? Colors.purple : Colors.darkgrey} minWidth buttonFn={updateOrCreate} disabled={!alteredMod || !topInput || max < 1} />
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