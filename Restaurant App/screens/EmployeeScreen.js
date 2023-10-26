import React, { useState, useRef, useEffect, useCallback } from 'react';
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
import { employeeRoles } from '../constants/employeeRoles'
import firebase from '../config/Firebase';
import { HeaderText, MainText, ClarifyingText, LargeText } from '../components/PortalText'
import MenuHeader from '../components/MenuHeader';
import MenuButton from '../components/MenuButton';
import DisablingScrollView from '../components/DisablingScrollview';
import { useSelector, useDispatch } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlatList, TouchableOpacity } from 'react-native-gesture-handler';
import capitalize from '../functions/capitalize';
import identicalArrays from '../functions/identicalArrays';
import RenderOverlay from '../components/RenderOverlay';
import RadioButton from '../components/RadioButton';
import useRestaurant from '../hooks/useRestaurant';

/*
  Automatically set as user
*/

export default function EmployeeScreen({ navigation, route }) {
  const restaurant_id = useRestaurant()
  let { employee_id, firstEmployee = false } = route?.params ?? {}
  const { employees, user, } = useSelector(state => state)
  let {
    name: fsName = '',
    roles: fsRoles = []
  } = employees[employee_id] ?? {}

  const [isEmployeeAltered, setIsEmployeeAltered] = useState(false)
  const [duplicateName, setDuplicateName] = useState(false)
  const [name, setName] = useState(fsName)
  const [roles, setRoles] = useState(firstEmployee ? employeeRoles : fsRoles)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!employee_id && !name) {
      // skip setting altered
    }
    else {
      setIsEmployeeAltered(() => {
        if (!employee_id && !name) {
          return false
        }
        return name !== fsName || !identicalArrays(roles, fsRoles)
      })
    }
  }, [name, roles, fsName, fsRoles])

  useEffect(() => {
    setDuplicateName(Object.keys(employees).some(e_id => {
      return e_id !== employee_id && employees[e_id].name === name
    }))
  }, [name, employees])

  const saveChanges = useCallback(async (new_name, new_roles) => {
    if (!new_roles.includes('manager') && !Object.keys(employees).some(e_id => e_id !== employee_id && employees[e_id].roles.includes('manager'))) {
      Alert.alert('Restaurant must always have a manager', 'You cannot remove the last manager from the restaurant.')
    }
    else if (!employee_id) {
      try {
        setIsSaving(true)
        const ordered_roles = employeeRoles.filter(role => new_roles.includes(role))
        let newEmployeeRef = firebase.firestore().collection('restaurants').doc(restaurant_id)
          .collection('restaurantEmployees').doc()
        await newEmployeeRef
          .set({
            name: new_name,
            roles: ordered_roles,
            pin: '',
            filterTables: 'open',
          })
        setIsSaving(false)
        navigation.navigate('Pin', { employee_id: newEmployeeRef.id, firstEmployee })
      }
      catch (error) {
        setIsSaving(false)
        console.log('saveChanges EmployeeScreen error: ', error)
        Alert.alert('Could not save employee', 'Please try again. Contact Torte support if the issue persists.')
      }
    }
    else if (isEmployeeAltered) {
      try {
        setIsSaving(true)
        const ordered_roles = employeeRoles.filter(role => new_roles.includes(role))
        await firebase.firestore().collection('restaurants').doc(restaurant_id)
          .collection('restaurantEmployees').doc(employee_id)
          .update({
            name: new_name,
            roles: ordered_roles,
          })
        setIsSaving(false)
        navigation.goBack()
      }
      catch (error) {
        setIsSaving(false)
        console.log('saveChanges EmployeeScreen error: ', error)
        Alert.alert('Could not save employee', 'Please try again. Contact Torte support if the issue persists.')
      }
    }
  }, [isEmployeeAltered, employees])

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <MenuHeader leftText='Back' leftFn={() => {
          if (isEmployeeAltered) {
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

        }} />

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : null} style={{ flex: 1, justifyContent: 'center', }}>
          <DisablingScrollView center contentContainerStyle={{ alignSelf: 'center' }}>

            <View style={{ width: Layout.window.width * 0.7 }}>
              {firstEmployee && <LargeText shadow style={{ textAlign: 'center' }}>OWNER ACCOUNT</LargeText>}
              <LargeText shadow style={{ textAlign: 'center' }}>{firstEmployee ? 'What is your name?' : 'What is the name of this employee?'}</LargeText>
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
                  placeholder='(employee name)'
                  placeholderTextColor={Colors.lightgrey}
                  // ref={nameRef}
                  returnKeyType='done'
                  selectTextOnFocus
                  value={name}
                />
              </View>
            </View>

            <View style={{ marginTop: Layout.spacer.large }}>
              <LargeText center>{firstEmployee ? 'We\'ll give you full permissions' : 'What roles / permissions for them?'}</LargeText>
              <View style={{ alignSelf: 'center', marginTop: 12 }}>
                {employeeRoles.map((role, index) => {
                  return <TouchableOpacity disabled={firstEmployee} key={role} style={{ flexDirection: 'row', paddingVertical: 12, alignItems: 'center' }} onPress={() => {
                    setRoles(prev => {
                      // unselect
                      if (prev[0] === role) {
                        let next = [...prev]
                        next.shift()
                        return next
                      }
                      return employeeRoles.slice(index)
                    })
                  }}>
                    <RadioButton on={roles.includes(role)} />
                    <LargeText>{capitalize(role)}</LargeText>
                  </TouchableOpacity>
                })}
              </View>
            </View>

            {!!employee_id && user !== employee_id && <TouchableOpacity style={{ marginTop: Layout.spacer.medium, paddingVertical: 10 }} onPress={() => {
              navigation.navigate('Pin', { employee_id, change_pin: true, manager_reset: employees[user].pin })
            }}>
              <LargeText center style={{ color: Colors.red }}>Manager pin reset</LargeText>
              <ClarifyingText center>(if they've forgotten their own pin)</ClarifyingText>
            </TouchableOpacity>}

            {!!employee_id && user !== employee_id && !employees[employee_id]?.roles.includes('owner') && <TouchableOpacity style={{ marginTop: Layout.spacer.medium, paddingVertical: 10 }} onPress={() => {
              Alert.alert('Are you sure you want to delete this employee?', undefined, [
                {
                  text: 'Yes, delete employee',
                  onPress: () => {
                    firebase.firestore().collection('restaurants').doc(restaurant_id)
                      .collection('restaurantEmployees').doc(employee_id).delete()
                    navigation.goBack()
                  }
                },
                {
                  text: 'No, cancel',
                  style: 'cancel'
                }
              ])
            }}>
              <LargeText center style={{ color: Colors.red }}>Delete employee</LargeText>
            </TouchableOpacity>}

          </DisablingScrollView>
          {duplicateName && <LargeText center style={{ color: Colors.red, fontWeight: 'bold' }}>NAME ALREADY TAKEN.{'\n'}Please use a different name</LargeText>}
          <View style={{ marginBottom: Layout.spacer.small, marginTop: Layout.spacer.medium, flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <MenuButton text='Discard changes' color={isEmployeeAltered ? Colors.red : Colors.darkgrey} buttonFn={() => {
              Alert.alert('Discard all changes?', undefined, [
                {
                  text: 'Yes', onPress: () => {
                    setName(fsName)
                    setRoles(fsRoles)
                  }
                },
                {
                  text: 'Cancel',
                  style: 'cancel'
                },
              ])

            }} disabled={!isEmployeeAltered} />
            <MenuButton text={duplicateName ? 'Duplicate name' : employee_id ? isEmployeeAltered ? 'Save changes' : 'No changes' : name ? 'Create and set pin' : 'Requires name'} color={!duplicateName && isEmployeeAltered ? Colors.purple : Colors.darkgrey} buttonFn={() => saveChanges(name, roles)} disabled={duplicateName || !isEmployeeAltered} />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
      { isSaving && <RenderOverlay text='Saving changes' opacity={0.9} />}
    </View >
  );
}

const styles = StyleSheet.create({
  assignmentsButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.purple,
    marginVertical: 12,
  },
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.30,
    shadowRadius: 5.30,

    elevation: 7,
  },
  employee: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: Colors.darkgrey,
    borderRadius: 12,
  }
});
