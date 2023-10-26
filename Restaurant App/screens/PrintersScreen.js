import React, { useCallback, useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Alert,
  FlatList,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { HeaderText, MainText, LargeText } from '../components/PortalText'
import MenuButton from '../components/MenuButton';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import firebase from '../config/Firebase';
import { TextInput, TouchableWithoutFeedback, TouchableOpacity, } from 'react-native-gesture-handler';
import Cursor from '../components/Cursor';
import { MaterialIcons, } from '@expo/vector-icons';
import * as Print from 'expo-print';
import useRestaurant from '../hooks/useRestaurant';

export default function PrintersScreen({ navigation, route }) {
  const { printers: fsPrinters = [] } = useSelector(state => state.privateDocs.private)
  const restaurant_id = useRestaurant()
  const [printers, setPrinters] = useState(fsPrinters)
  const [arePrintersAltered, setArePrintersAltered] = useState(false)
  const [alreadyConnected, setAlreadyConnected] = useState('')

  useEffect(() => {
    setArePrintersAltered(printers.length !== fsPrinters.length || printers.some((printer, index) => {
      // console.log('name: ', printer.name !== fsPrinters[index].name)
      // console.log('i name: ', printer.internal_name !== fsPrinters[index].internal_name, printer.internal_name, fsPrinters[index].internal_name)
      // console.log('url: ', printer.url !== fsPrinters[index].url)
      // console.log('default: ', printer.isDefault !== fsPrinters[index].isDefault)
      return printer.name !== fsPrinters[index].name || printer.internal_name !== fsPrinters[index].internal_name || printer.url !== fsPrinters[index].url || printer.isDefault !== fsPrinters[index].isDefault
    }))
  }, [fsPrinters, printers])

  const updatePrinters = async (new_printers) => {
    try {
      firebase.firestore().collection('restaurants').doc(restaurant_id)
        .collection('restaurantPrivate').doc('private')
        .update({
          printers: new_printers
        })
    }
    catch (error) {
      console.log('updatePrinters error: ', error)
      Alert.alert('Error editing printers.', 'Please try again and contact Torte support if the error persists.')
    }
  }


  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          margin: 16,
        }}>
          <View style={{ flex: 1, }}>
            <TouchableOpacity onPress={() => {
              if (arePrintersAltered) {
                Alert.alert('Leave without saving changes?', undefined, [
                  {
                    text: 'Yes',
                    onPress: () => navigation.goBack()
                  },
                  {
                    text: 'No',
                    style: 'cancel'
                  }
                ])
              }
              else {
                navigation.goBack()
              }
            }}>
              <MaterialIcons
                name='arrow-back'
                size={40}
                color={Colors.white}
              />
            </TouchableOpacity>
          </View>

          <HeaderText>Printers</HeaderText>

          <View style={{ flex: 1, alignItems: 'flex-end' }}>
          </View>
        </View>

        <FlatList
          data={printers}
          style={{ marginTop: 40 }}
          keyExtractor={printer => printer.url}
          renderItem={({ item, index }) => <Printer {...item} setPrinters={setPrinters} index={index} />}
          ListEmptyComponent={() => {
            return <LargeText center>No printers connected</LargeText>
          }}

          ListFooterComponent={() => {
            return <View style={{ margin: 40, borderTopColor: Colors.white, borderTopWidth: 1 }}>
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 40, }}>
                {!!alreadyConnected && <View style={{ marginBottom: 20 }}>
                  <LargeText center style={{ color: Colors.red }}>Printer already exists</LargeText>
                  <LargeText center style={{ color: Colors.red }}>{alreadyConnected}</LargeText>
                </View>}
                <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', }}
                  onPress={async () => {
                    setAlreadyConnected('')

                    let printer = await Print.selectPrinterAsync()

                    if (printers.some(({ url, name }) => url === printer.url && name === printer.name)) {
                      setAlreadyConnected(`${printer.name} as ${printer.internal_name || '[no name given]'}`)
                    }
                    else {
                      console.log('new printer')
                      setPrinters(prev => {
                        return [
                          {
                            ...printer,
                            internal_name: '',
                            isDefault: false,
                          },
                          ...prev
                        ]
                      })
                    }
                  }}
                >
                  <MaterialIcons
                    name='add-circle-outline'
                    color={Colors.green}
                    size={40}
                    style={{ paddingVertical: 6, paddingHorizontal: 20 }}
                  />
                  <HeaderText>Add a printer</HeaderText>
                </TouchableOpacity>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
                <MenuButton text='Discard changes' color={arePrintersAltered ? Colors.red : Colors.darkgrey} buttonFn={() => {
                  Alert.alert('Discard all changes?', undefined, [
                    {
                      text: 'Yes', onPress: () => {
                        setPrinters(fsPrinters)
                      }
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel'
                    },
                  ])
                }} disabled={!arePrintersAltered} />
                <MenuButton text={arePrintersAltered ? 'Save changes' : 'No changes'} color={arePrintersAltered ? Colors.purple : Colors.darkgrey} buttonFn={() => updatePrinters(printers)} disabled={!arePrintersAltered} />
              </View>
            </View>
          }}
        />

      </SafeAreaView>
    </View >
  );
}

const Printer = ({ name, internal_name, isDefault, url, setPrinters, index }) => {

  return <View style={{ flexDirection: 'row', marginHorizontal: 100, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.softwhite, paddingVertical: 20 }}>
    <TouchableOpacity style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }} onPress={() => {
      setPrinters(prev => {
        let next = [...prev]

        if (!isDefault) {
          next = next.map(printer => ({ ...printer, isDefault: false }))
        }

        next[index] = { ...next[index], isDefault: !isDefault }

        return next
      })
    }}>
      <MaterialIcons
        name={isDefault ? 'star' : 'star-outline'}
        color={isDefault ? Colors.yellow : Colors.lightgrey}
        size={50}
      />
    </TouchableOpacity>
    <View style={{ flex: 1, }}>
      <MainText >{name}</MainText>
      <TextInput
        style={[styles.input, {
          marginTop: 8,
          color: Colors.softwhite,
          fontSize: 30,
        }]}
        autoCapitalize='sentences'
        autoCorrect
        blurOnSubmit
        enablesReturnKeyAutomatically
        selectTextOnFocus
        onChangeText={text => {
          setPrinters(prev => {
            let next = [...prev]
            next[index] = { ...next[index], internal_name: text }
            return next
          })
        }}
        placeholder='[printer name]'
        placeholderTextColor={Colors.lightgrey}
        value={internal_name}
      />
    </View>

    <TouchableOpacity style={{ flex: 1, justifyContent: 'center', paddingHorizontal: 20 }} onPress={() => {
      Alert.alert(`Remove printer ${internal_name || name}?`, undefined, [
        {
          text: 'Yes',
          onPress: () => {
            setPrinters(prev => {
              let next = [...prev]
              next.splice(index, 1)
              return next
            })
          }
        },
        {
          text: 'No',
          style: 'cancel'
        }
      ])
    }}>
      <MaterialIcons
        name={'remove-circle'}
        color={Colors.red}
        size={50}
      />
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