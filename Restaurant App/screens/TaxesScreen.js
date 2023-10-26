import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  PixelRatio,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Alert,

} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native-gesture-handler';
import { useSelector } from 'react-redux';
import firebase from '../config/Firebase';
import { MaterialIcons, } from '@expo/vector-icons';
import Cursor from '../components/Cursor';

import identicalArrays from '../functions/identicalArrays';
import commaList from '../functions/commaList';
import useRestaurant from '../hooks/useRestaurant';

const DECIMAL_REGEX = /^([0-9]*[.])?[0-9]*$/


export default function TaxesScreen({ navigation, route }) {
  const restaurant_id = useRestaurant()
  const { restaurant: { taxRates: fsTaxRates }, items = {} } = useSelector(state => state)

  const [taxRates, setTaxRates] = useState(fsTaxRates)
  const [itemNames, setItemNames] = useState({})
  const [areTaxRatesAltered, setAreTaxRatesAltered] = useState(false)

  useEffect(() => {
    setAreTaxRatesAltered(!identicalArrays(Object.keys(taxRates), Object.keys(fsTaxRates)) ||
      !!~Object.keys(taxRates).findIndex(key => {
        return taxRates[key].name !== fsTaxRates[key].name || taxRates[key].rate !== fsTaxRates[key].rate
      }))
  }, [taxRates, fsTaxRates])

  useEffect(() => {
    /*
    List of item names that each tax rate is assign to
    Prevents deletion of tax rate if assigned to an item
    */
    let names = {}
    Object.keys(fsTaxRates).forEach(key => names[key] = [])
    Object.keys(items).map(item_id => {
      let item = items[item_id]
      if (item.taxRate) {
        names[item.taxRate].push(item.name)
      }
    })
    setItemNames(names)
  }, [fsTaxRates])

  const saveTaxRates = async () => {
    let newTaxRates = {}
    let errorTaxRate = false

    Object.keys(taxRates).forEach(key => {
      if (!taxRates[key].name) {
        errorTaxRate = true
      }
      if (!errorTaxRate) {
        newTaxRates[key] = {
          name: taxRates[key].name,
          percent: parseFloat(taxRates[key].percent)
        }
      }
    })

    if (errorTaxRate) {
      Alert.alert('All taxes must have a name')
    }
    else {
      try {
        firebase.firestore().collection('restaurants').doc(restaurant_id)
          .update({ taxRates: newTaxRates })
        navigation.goBack()
      }
      catch (error) {
        console.log('TaxesScreen saveTaxRates error: ', error)
        Alert.alert('Could not save tax rates', 'Please try again. Contact Torte support if the issue persists.')
      }
    }

  }

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <MenuHeader leftText='Back' leftFn={() => { navigation.goBack() }} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, }}>
          <DisablingScrollView
            // keyboardShouldPersistTaps='always' 
            contentContainerStyle={{ marginHorizontal: Layout.window.width * 0.1, }}>

            <HeaderText center style={{ marginBottom: Layout.spacer.medium }}>Tax rates</HeaderText>

            <View style={{ marginBottom: Layout.spacer.large }}>
              <MainText center>Create a new tax rate</MainText>
              <ClarifyingText center>Press the green + when finished</ClarifyingText>
              <TaxRate setTaxRates={setTaxRates} add />
            </View>

            {!!Object.keys(taxRates).length && <View >
              <MainText center>Edit an existing tax rate</MainText>
              <ClarifyingText center>Editing affects all linked items</ClarifyingText>
              {Object.keys(taxRates).map(key => {
                return <TaxRate
                  key={key}
                  id={key}
                  taxRate={taxRates[key]}
                  setTaxRates={setTaxRates}
                  itemNames={itemNames[key]}
                />
              })}
            </View>}


            {
              route?.params?.review ?
                <View style={{ marginVertical: Layout.spacer.large, flexDirection: 'row', justifyContent: 'space-around' }}>
                  <MenuButton text='Discard changes' color={areTaxRatesAltered ? Colors.red : Colors.darkgrey} buttonFn={() => {
                    Alert.alert('Discard all changes?', undefined, [
                      {
                        text: 'Yes', onPress: () => {
                          setTaxRates(fsTaxRates)
                        }
                      },
                      {
                        text: 'Cancel',
                        style: 'cancel'
                      },
                    ])
                  }} disabled={!areTaxRatesAltered} />
                  <MenuButton text={areTaxRatesAltered ? 'Save changes' : 'No changes'} color={areTaxRatesAltered ? Colors.purple : Colors.darkgrey} buttonFn={saveTaxRates} disabled={!areTaxRatesAltered} />
                </View>
                : <MenuButton style={{ marginBottom: Layout.spacer.small, marginTop: Layout.spacer.large }} text='Finish' buttonFn={() => {
                  if (areTaxRatesAltered) {
                    saveTaxRates()
                  }
                  else {
                    navigation.goBack()
                  }
                }} />

            }
          </DisablingScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View >
  );
}

// MULTIPLE THE RATE BEFORE YOU GET HERE.
const TaxRate = ({ id, taxRate, fsTaxRates, setTaxRates, itemNames = [], add = false }) => {
  const [addName, setAddName] = useState('')
  const [addPercent, setAddPercent] = useState('0')
  const [percentFocused, setPercentFocused] = useState(false)
  const percentRef = useRef(null)

  return <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: Layout.spacer.small, alignSelf: 'center' }}>
    <TextInput
      style={[styles.input, {
        width: Layout.window.width * 0.4,
        marginRight: Layout.spacer.medium,
        color: Colors.softwhite,
        fontSize: 30,
      }]}
      autoCapitalize='sentences'
      autoCorrect
      blurOnSubmit
      enablesReturnKeyAutomatically
      selectTextOnFocus
      onChangeText={text => {
        if (add) {
          setAddName(text)
        }
        else {
          setTaxRates(prev => {
            return {
              ...prev,
              [id]: {
                ...prev[id],
                name: text,
                // altered: text !== fsTaxRates?.[id]?.name || taxRate.percent !== fsTaxRates?.[id]?.percent
              }
            }
          })
        }
      }}
      onSubmitEditing={() => percentRef.current.focus()}
      placeholder='[tax name]'
      placeholderTextColor={Colors.lightgrey}
      value={add ? addName : taxRate.name}
    />

    <TouchableWithoutFeedback onPress={() => {
      percentRef?.current?.focus()
    }}>
      <View style={[styles.input, { width: Layout.window.width * 0.15, flexDirection: 'row', justifyContent: 'flex-end' }]}>
        <LargeText>{add ? addPercent : taxRate.percent}</LargeText>
        <Cursor cursorOn={percentFocused} />
        <LargeText style={{ marginLeft: 2 }}>%</LargeText>

      </View>
    </TouchableWithoutFeedback>

    <TextInput
      style={{ height: 0, width: 0, color: Colors.backgroundColor }}
      enablesReturnKeyAutomatically
      keyboardType='decimal-pad'
      blurOnSubmit
      enablesReturnKeyAutomatically
      onSubmitEditing={() => Keyboard.dismiss()}
      onChangeText={text => {
        if (!text) {
          text = '0'
        }

        if (text.match(DECIMAL_REGEX)) {
          if (text[0] === '0' && parseInt(text[1])) {
            // trim leading 0s
            text = text[1]
          }

          // Cannot parse float or you will lose decimal position
          if (add) {
            setAddPercent(text)
          }
          else {
            setTaxRates(prev => {
              return {
                ...prev,
                [id]: {
                  ...prev[id],
                  percent: text,
                  // altered: taxRate.name !== fsTaxRates?.[id]?.name || text !== fsTaxRates?.[id]?.percent
                }
              }
            })
          }
        }


      }}
      ref={percentRef}
      value={add ? addPercent.toString() : taxRate.percent.toString()}
      onFocus={() => {
        setPercentFocused(true)
      }}
      onBlur={() => {
        setPercentFocused(false)
      }}
    />

    <TouchableOpacity style={{ marginLeft: Layout.spacer.medium }} onPress={() => {
      if (add) {
        let percent = parseFloat(addPercent)
        if (!addName) {
          Alert.alert('Missing name')
        }
        else if (isNaN(percent)) {
          Alert.alert('Invalid percent')
        }
        else {
          let { id } = firebase.firestore().collection('restaurants').doc()
          setTaxRates(prev => {
            return {
              ...prev,
              [id]: {
                name: addName,
                percent,
                altered: true
              }
            }
          })
          setAddName('')
          setAddPercent('0')
        }
      }
      else if (itemNames.length) {
        Alert.alert('Cannot delete tax.', 'Please remove from all items to delete. This tax is assigned to ' + itemNames.length + (itemNames.length > 1 ? ' items' : ' item: ') + commaList(itemNames))
      }
      else {
        setTaxRates(prev => {
          let { [id]: discard, ...next } = prev
          console.log('next: ', next, id)
          return next
        })
      }
    }}>
      {
        add ?
          <MaterialIcons name='add-circle' size={50} color={Colors.green} /> :
          <MaterialIcons name='remove-circle' size={50} color={itemNames.length ? Colors.darkgrey : Colors.red} />
      }
    </TouchableOpacity>
  </View>
}



const styles = StyleSheet.create({
  input: {
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: Colors.darkgrey,
  }
});
