import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Dimensions,
} from 'react-native';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { ClarifyingText, HeaderText, LargeText, MainText, } from '../components/PortalText'
import { SafeAreaView } from 'react-native-safe-area-context';
import MenuHeader from '../components/MenuHeader';
import { useSelector, useDispatch } from 'react-redux';

import { TouchableOpacity } from 'react-native-gesture-handler';
import { useFocusEffect } from '@react-navigation/native';
import { clearTracker } from '../redux/actionsTracker';
import firebase from '../config/Firebase';
import useRestaurant from '../hooks/useRestaurant';

const screenHeight = Dimensions.get('screen').height

export default function MenuPortal({ navigation, route }) {
  const dispatch = useDispatch()
  const restaurant_id = useRestaurant()
  const { menus = {}, sections = {}, items = {}, photos = {}, photoAds = {}, specifications = {}, modifications = {},
    employees = {}, app: { listener_complete: { employees: employees_listener_complete } }, } = useSelector(state => state)

  useFocusEffect(useCallback(() => {
    dispatch(clearTracker())
  }, []))

  useFocusEffect(useCallback(() => {
    /*
      Likely a terrible way to ensure that the owner did not create their employee name, but back out of their PIN
      Check to make sure there is a pin
      If not, delete whatever employees exist and cretae a new first employee
    */
    const deleteEmployee = async (employee_id) => {
      await firebase.firestore().collection('restaurants').doc(restaurant_id)
        .collection('restaurantEmployees').doc(employee_id).delete()
    }

    if (employees_listener_complete && !Object.keys(employees).some(e_id => employees[e_id].pin)) {
      Object.keys(employees).forEach((e_id) => {
        deleteEmployee(e_id)
      })
      navigation.navigate('Employee', { firstEmployee: true })
    }
  }, [employees, employees_listener_complete]))

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaView style={{ flex: 1, }}>
        <MenuHeader leftText='Dashboard' leftFn={() => {
          navigation.navigate('Dashboard')
        }}
        // rightText='test logout' rightFn={() => {
        //   firebase.auth().signOut().catch(function (error) {
        //     console.log('signout error: ', error)
        //   })
        // }} 
        />

        <HeaderText style={{ textAlign: 'center' }}>Manager Portal</HeaderText>


        <View style={{ flex: 1, justifyContent: 'space-evenly', marginBottom: screenHeight * 0.1 }}>
          <TouchableOpacity onPress={() => { navigation.navigate('RegistrationStack', { screen: 'Review', params: { back: true } }) }}>
            <View>
              <LargeText style={{ textAlign: 'center' }}>RESTAURANT</LargeText>
              <MainText style={{ textAlign: 'center' }}>Hours of operation, contact info, and more</MainText>
            </View>
          </TouchableOpacity>

          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <TouchableOpacity onPress={() => {
              navigation.navigate('Taxes')
            }}>
              <View style={styles.box}>
                <LargeText>Tax Rates</LargeText>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              navigation.navigate('Tips')
            }}>
              <View style={styles.box}>
                <LargeText>Tip Options</LargeText>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ borderTopColor: Colors.softwhite, borderTopWidth: 2, marginHorizontal: 50 }} />

          <TouchableOpacity onPress={() => {
            navigation.navigate('MealsList')
          }}>
            <View>
              <LargeText style={{ textAlign: 'center' }}>MEALS</LargeText>
              <MainText style={{ textAlign: 'center' }}>Set menu times</MainText>
            </View>
          </TouchableOpacity>


          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <TouchableOpacity onPress={() => {
              // if (!Object.keys(menus).length) => addMenu
              if (Object.keys(menus).length) {
                navigation.navigate('CategoryList', { category: 'menu' })
              }
              else {
                navigation.navigate('WallOfText', { page: 'menu' })
              }
            }}>
              <View style={styles.box}>
                <LargeText>MENUS</LargeText>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              if (Object.keys(sections).length) {
                navigation.navigate('CategoryList', { category: 'section' })
              }
              else {
                navigation.navigate('Create', { category: 'section' })
              }
            }}>
              <View style={styles.box}>
                <LargeText>SECTIONS</LargeText>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly' }}>
            <TouchableOpacity onPress={() => {
              if (Object.keys(items).length) {
                navigation.navigate('CategoryList', { category: 'item' })
              }
              else {
                navigation.navigate('WallOfText', { page: 'item' })
              }
            }}>
              <View style={styles.box}>
                <LargeText>ITEMS</LargeText>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              if (Object.keys(photoAds).length) {
                navigation.navigate('CategoryList', { category: 'photoAd' })
              }
              else if (!Object.keys(photos).filter(key => key !== 'logo').length) {
                Alert.alert('You need items with photos to create a photo ad')
              }
              else {
                navigation.navigate('WallOfText', { page: 'photoAd' })
              }
            }}>
              <View style={styles.box}>
                <LargeText>PHOTO ADS</LargeText>
              </View>
            </TouchableOpacity>
          </View>

          <View style={{ flexDirection: 'row', justifyContent: 'space-evenly', }}>
            <TouchableOpacity onPress={() => {

              if (Object.keys(specifications).length) {
                navigation.navigate('CategoryList', { category: 'specification' })
              }
              else {
                navigation.navigate('Spec')
              }
            }}>
              <View style={styles.box}>
                <MainText style={{ lineHeight: 36 }}>SPECIFICATIONS</MainText>
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              if (Object.keys(modifications).length) {
                navigation.navigate('CategoryList', { category: 'modification' })
              }
              else {
                navigation.navigate('Mod')
              }
            }}>
              <View style={styles.box}>
                <LargeText>ADD-ONS</LargeText>
              </View>
            </TouchableOpacity>
          </View>

        </View>




      </SafeAreaView>
    </View >
  );
}

const styles = StyleSheet.create({
  box: {
    width: Layout.window.width * 0.35,
    paddingVertical: 20,
    borderColor: Colors.softwhite,
    borderWidth: 3,
    alignItems: 'center',
  }
});