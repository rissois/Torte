import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import firebase from '../config/Firebase';
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { useSelector, } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { MaterialIcons, } from '@expo/vector-icons';
import RenderOverlay from '../components/RenderOverlay';
import useFilteredBills from '../hooks/useFilteredBills';
import useRestaurant from '../hooks/useRestaurant';

/*
  Automatically set as user
*/

export default function TableScreen({ navigation, route }) {
  const restaurant_id = useRestaurant()
  let { table_id } = route?.params ?? {}
  const { openBillsInTables } = useFilteredBills()
  const { tables, restaurant: { root_code, name: restaurant_name }, } = useSelector(state => state)
  let {
    code: fsCode = '',
    name: fsName = undefined,
  } = tables[table_id]?.table_details ?? {}

  const [isTableAltered, setIsTableAltered] = useState(false)
  const [duplicateCode, setDuplicateCode] = useState(false)
  const [duplicateName, setDuplicateName] = useState(false)
  const [code, setCode] = useState(fsCode)
  const [name, setName] = useState(fsName)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!table_id) {
      if (code.length === 2 && name) {
        setIsTableAltered(true)
      }
      else {
        setIsTableAltered(false)
      }
    }
    else {
      setIsTableAltered(() => {
        return name !== fsName || code !== fsCode
      })
    }
  }, [name, code, fsName, fsCode])

  useEffect(() => {
    setDuplicateCode(code.length === 2 && code !== 'MN' && code !== 'TG' && Object.keys(tables).some(t_id => {
      return t_id !== table_id && tables[t_id].table_details.code === code
    }))
  }, [code, tables])

  useEffect(() => {
    setDuplicateName(Object.keys(tables).some(t_id => {
      return t_id !== table_id && tables[t_id].table_details.name === name
    }))
  }, [name, tables])

  const saveChanges = useCallback(async (new_name, new_code) => {
    if (!table_id) {
      try {
        setIsSaving(true)
        let newTableRef = firebase.firestore().collection('restaurants').doc(restaurant_id)
          .collection('restaurantTables').doc()
        console.log('new id: ', newTableRef.id)
        await newTableRef
          .set({
            table_details: {
              id: newTableRef.id,
              name: new_name,
              code: new_code,
            },
            server_details: {
              id: '',
              name: '',
            },
            restaurant_details: {
              id: restaurant_id,
              name: restaurant_name,
            },
            input_code: root_code ? root_code + new_code : ''
          })
        setIsSaving(false)
        navigation.goBack()
      }
      catch (error) {
        setIsSaving(false)
        console.log('saveChanges TableScreen error: ', error)
        Alert.alert('Could not save table', 'Please try again. Contact Torte support if the issue persists.')
      }
    }
    else if (isTableAltered) {
      try {
        setIsSaving(true)
        await firebase.firestore().collection('restaurants').doc(restaurant_id)
          .collection('restaurantTables').doc(table_id)
          .set({
            table_details: {
              name: new_name,
              code: new_code,
            },
            input_code: root_code ? root_code + new_code : '',
          }, { merge: true })
        setIsSaving(false)
        navigation.goBack()
      }
      catch (error) {
        setIsSaving(false)
        console.log('saveChanges TableScreen error: ', error)
        Alert.alert('Could not save table', 'Please try again. Contact Torte support if the issue persists.')
      }
    }
  }, [isTableAltered, tables])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <View style={{ flexDirection: 'row', padding: 12, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => {
              if (isTableAltered) {
                Alert.alert(`Are you sure you want to leave without saving?`, undefined, [
                  {
                    text: 'Yes', onPress: async () => {
                      navigation.goBack()
                    }
                  },
                  // {
                  //   text: 'No',
                  //   onPress: async () => {
                  //     navigation.goBack()
                  //   }
                  // },
                  {
                    text: 'Cancel',
                    style: 'cancel',
                  },

                ])
              }
              else {
                navigation.goBack()
              }
            }}>
              <MaterialIcons
                name='arrow-back'
                color={Colors.softwhite}
                size={34}
              />
            </TouchableOpacity>
          </View>
          <HeaderText>{table_id ? 'Edit ' + fsName : 'New table'}</HeaderText>
          <View style={{ flex: 1 }}></View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, justifyContent: 'center', }}>
          <DisablingScrollView center keyboardShouldPersistTaps={'always'} contentContainerStyle={{ alignSelf: 'center' }}>

            <View style={{ width: Layout.window.width * 0.7 }}>
              <LargeText shadow center>What is the code for this table?</LargeText>
              <ClarifyingText center>This should align with the last two characters on its placard</ClarifyingText>
              <ClarifyingText center>(i.e. {root_code}04 would be "04")</ClarifyingText>
              <View style={{
                flexDirection: 'row',
                marginTop: Layout.spacer.medium,
                borderBottomColor: name ? Colors.softwhite : Colors.lightgrey,
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
                  autoCapitalize={'characters'}
                  autoCompleteType={'off'}
                  autoCorrect={false}
                  blurOnSubmit={false}
                  enablesReturnKeyAutomatically

                  onChangeText={text => {
                    if (name === undefined || name === ('Table ' + code)) {
                      if (!text) {
                        setName(fsName)
                      }
                      else {
                        setName('Table ' + text)
                      }
                    }
                    if (text.length <= 2) {
                      setCode(text)
                    }
                  }}
                  // onSubmitEditing={() => {}}
                  placeholder='(two-character code)'
                  placeholderTextColor={Colors.lightgrey}
                  // ref={nameRef}
                  returnKeyType='done'
                  value={code}
                />
              </View>
              <MainText center style={{ marginTop: 5 }}>(must be two characters)</MainText>
            </View>

            <View style={{ marginTop: Layout.spacer.large }}>
              <LargeText shadow center>What is the name for this table?</LargeText>
              <ClarifyingText center>This will be visible to guests when they start their tab</ClarifyingText>
              <ClarifyingText center>(e.g. Table 4 or Carry-out)</ClarifyingText>
              <View style={{
                flexDirection: 'row',
                marginTop: Layout.spacer.medium,
                borderBottomColor: name ? Colors.softwhite : Colors.lightgrey,
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
                  onChangeText={text => setName(text)}
                  // onSubmitEditing={() => {}}
                  placeholder='(table name)'
                  placeholderTextColor={Colors.lightgrey}
                  // ref={nameRef}
                  returnKeyType='done'
                  defaultValue={'Table '}
                  value={name}
                />
              </View>
            </View>

            {!!table_id && <TouchableOpacity style={{ marginTop: Layout.spacer.large, paddingVertical: 10 }} onPress={() => {
              if (openBillsInTables[table_id]?.length) {
                Alert.alert('Cannot delete table', 'We notice there are still open bills at this table. Please wait until they close to delete this table')
              }
              else {
                Alert.alert('Are you sure you want to delete this table?', 'We highly caution against deleting tables this during service, as bills and orders will disappear from your Dashboard. Instead, remove the placard for several days before deleting the table.', [
                  {
                    text: 'I understand the risk. Delete table',
                    onPress: () => {
                      firebase.firestore().runTransaction(async transaction => {
                        let restaurantRef = firebase.firestore().collection('restaurants').doc(restaurant_id)
                        let tableSectionsRef = restaurantRef.collection('restaurantPrivate').doc('tableSections')
                        let tableSections = (await transaction.get(tableSectionsRef)).data()
                        Object.keys(tableSections).forEach(ts_id => {
                          let table_index = tableSections[ts_id].tables.indexOf(table_id)
                          if (~table_index) {
                            tableSections[ts_id].tables.splice(table_index, 1)
                          }
                        })
                        tableSectionsRef.set(tableSections)
                        transaction.delete(restaurantRef.collection('restaurantTables').doc(table_id))
                      })
                        .then(() => navigation.goBack())
                        .catch(error => {
                          console.log('Delete table error: ', error)
                          Alert.alert('Failed to delete table.', 'Please contact Torte support if the issue persists')
                        })
                    }
                  },
                  {
                    text: 'No, cancel',
                    style: 'cancel'
                  }
                ])
              }

            }}>
              <LargeText center style={{ color: Colors.red }}>Delete table</LargeText>
            </TouchableOpacity>}

          </DisablingScrollView>
          <View>
            {(code === 'MN' || code === 'TG') && <LargeText center style={{ color: Colors.red, fontWeight: 'bold' }}>CODE {code} IS RESERVED.{'\n'}Please use a different code</LargeText>}
            {duplicateCode && <LargeText center style={{ color: Colors.red, fontWeight: 'bold' }}>CODE ALREADY TAKEN.{'\n'}Please use a different code</LargeText>}
            {!duplicateCode && <LargeText center style={{ color: duplicateName ? Colors.red : Colors.background, fontWeight: 'bold' }}>NAME ALREADY TAKEN.{'\n'}Please use a different name</LargeText>}
          </View>
          <View style={{ marginBottom: Layout.spacer.small, marginTop: Layout.spacer.medium, flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <MenuButton text={isTableAltered ? 'Discard changes' : 'No changes'} color={isTableAltered ? Colors.red : Colors.darkgrey} buttonFn={() => {
              Alert.alert('Discard all changes?', undefined, [
                {
                  text: 'Yes', onPress: () => {
                    setName(fsName)
                    setCode(fsCode)
                  }
                },
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
              ])

            }} disabled={!isTableAltered || code === 'MN' || code === 'TG'} />
            <MenuButton text={code === 'MN' || code === 'TG' ? 'Reserved code' : duplicateCode ? 'Duplicate code' : duplicateName ? 'Duplicate name' : code.length !== 2 ? 'Invalid code' : !name ? 'Missing name' : table_id ? isTableAltered ? 'Save changes' : 'No changes' : 'Create table'} color={!duplicateCode && !duplicateName && isTableAltered && name && code.length === 2 ? Colors.purple : Colors.darkgrey} buttonFn={() => saveChanges(name, code)} disabled={duplicateCode || duplicateName || !isTableAltered || code.length !== 2 || !name} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      { isSaving && <RenderOverlay text='Saving changes' opacity={0.9} />}
    </View >
  );
}

const styles = StyleSheet.create({
});
