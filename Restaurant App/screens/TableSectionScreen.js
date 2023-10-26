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
import useRestaurant from '../hooks/useRestaurant';

/*
  Automatically set as user
*/

export default function TableSectionScreen({ navigation, route }) {
  let { section_id } = route?.params ?? {}
  const restaurant_id = useRestaurant()
  const { privateDocs: { tableSections } } = useSelector(state => state)
  const tableSectionsRef = firebase.firestore().collection('restaurants').doc(restaurant_id)
    .collection('restaurantPrivate').doc('tableSections')
  let {
    name: fsName = undefined,
  } = tableSections[section_id] ?? {}

  const [isSectionAltered, setIsSectionAltered] = useState(false)
  const [duplicateName, setDuplicateName] = useState(false)
  const [name, setName] = useState(fsName)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!section_id) {
      if (name) {
        setIsSectionAltered(true)
      }
      else {
        setIsSectionAltered(false)
      }
    }
    else {
      setIsSectionAltered(() => {
        return name !== fsName
      })
    }
  }, [name, fsName,])

  useEffect(() => {
    setDuplicateName(Object.keys(tableSections).some(s_id => {
      return s_id !== section_id && tableSections[s_id].name === name
    }))
  }, [name, tableSections])

  const saveChanges = useCallback(async (new_name) => {
    if (!section_id) {
      try {
        setIsSaving(true)

        let generateID = firebase.firestore().collection('restaurants').doc()
        await tableSectionsRef
          .set({
            [generateID.id]: {
              id: generateID.id,
              name: new_name,
              tables: []
            }
          }, { merge: true })
        setIsSaving(false)
        navigation.goBack()
      }
      catch (error) {
        setIsSaving(false)
        console.log('saveChanges TableSectionScreen error: ', error)
        Alert.alert('Could not save section', 'Please try again. Contact Torte support if the issue persists.')
      }
    }
    else if (isSectionAltered) {
      try {
        setIsSaving(true)
        await tableSectionsRef
          .set({
            [section_id]: {
              name: new_name,
            }
          }, { merge: true })
        setIsSaving(false)
        navigation.goBack()
      }
      catch (error) {
        setIsSaving(false)
        console.log('saveChanges TableSectionScreen error: ', error)
        Alert.alert('Could not save section', 'Please try again. Contact Torte support if the issue persists.')
      }
    }
  }, [isSectionAltered, tableSections])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <View style={{ flexDirection: 'row', padding: 12, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <TouchableOpacity onPress={() => {
              if (isSectionAltered) {
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
          <HeaderText>{section_id ? 'Edit ' + fsName : 'New section'}</HeaderText>
          <View style={{ flex: 1 }}></View>
        </View>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, justifyContent: 'center', }}>
          <DisablingScrollView center keyboardShouldPersistTaps={'always'} contentContainerStyle={{ alignSelf: 'center' }}>

            <View style={{ marginTop: Layout.spacer.large }}>
              <LargeText shadow center>What is the name for this section?</LargeText>
              <ClarifyingText center>(e.g. Section 10)</ClarifyingText>
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
                  placeholder='(section name)'
                  placeholderTextColor={Colors.lightgrey}
                  // ref={nameRef}
                  returnKeyType='done'
                  defaultValue={'Section '}
                  value={name}
                />
              </View>
            </View>

            {!!section_id && <TouchableOpacity style={{ marginTop: Layout.spacer.large, paddingVertical: 10 }} onPress={() => {

              Alert.alert('Are you sure you want to delete this section?', undefined, [
                {
                  text: 'Yes, delete section',
                  onPress: () => {
                    tableSectionsRef.update({
                      [section_id]: firebase.firestore.FieldValue.delete()
                    })
                    navigation.goBack()
                  }
                },
                {
                  text: 'No, cancel',
                  style: 'cancel'
                }
              ])

            }}>
              <LargeText center style={{ color: Colors.red }}>Delete section</LargeText>
            </TouchableOpacity>}

          </DisablingScrollView>
          <View>
            {<LargeText center style={{ color: duplicateName ? Colors.red : Colors.background, fontWeight: 'bold' }}>NAME ALREADY TAKEN.{'\n'}Please use a different name</LargeText>}
          </View>
          <View style={{ marginBottom: Layout.spacer.small, marginTop: Layout.spacer.medium, flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <MenuButton text={isSectionAltered ? 'Discard changes' : 'No changes'} color={isSectionAltered ? Colors.red : Colors.darkgrey} buttonFn={() => {
              Alert.alert('Discard all changes?', undefined, [
                {
                  text: 'Yes', onPress: () => {
                    setName(fsName)
                  }
                },
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
              ])

            }} disabled={!isSectionAltered} />
            <MenuButton text={duplicateName ? 'Duplicate name' : !name ? 'Missing name' : section_id ? isSectionAltered ? 'Save changes' : 'No changes' : 'Create section'} color={!duplicateName && isSectionAltered && name ? Colors.purple : Colors.darkgrey} buttonFn={() => saveChanges(name)} disabled={duplicateName || !isSectionAltered || !name} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      { isSaving && <RenderOverlay text='Saving changes' opacity={0.9} />}
    </View >
  );
}

const styles = StyleSheet.create({
});
