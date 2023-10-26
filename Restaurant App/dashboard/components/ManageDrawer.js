import React, { useState, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  UIManager,
  LayoutAnimation,
  TouchableWithoutFeedback,
  FlatList,
} from 'react-native';
import firebase from 'firebase';
import Colors from '../../utils/constants/Colors';
import { DefaultText, ExtraLargeText, LargeText, MediumText, } from '../../utils/components/NewStyledText';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector, } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import useIsMyAccountAdmin from '../../utils/hooks/useIsMyAccountAdmin';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import Layout from '../../utils/constants/Layout';
import Header from '../../utils/components/Header';
import { doAllStart } from '../../redux/actions/actionsAll';
import { doAppReset } from '../../redux/actions/actionsApp';
import { useRestaurantID } from '../../utils/hooks/useRestaurant';
import { selectBillsNumberUnpaid } from '../../redux/selectors/selectorsBills';
import useSlideIn from '../../utils/hooks/useSlideIn';

// See https://reactnative.dev/docs/layoutanimation
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ManageDrawer({ isOpen, closeDrawer, }) {
  const dispatch = useDispatch()
  const navigation = useNavigation()
  const [showDrawer, animateCloseDrawer] = useSlideIn(closeDrawer)
  const isAdmin = useIsMyAccountAdmin()
  const currentRestaurantID = useRestaurantID()
  const numberUnpaid = useSelector(selectBillsNumberUnpaid)

  const [restaurants, setRestaurants] = useState(null)
  const [isGettingRestaurants, setIsGettingRestaurants] = useState(false)

  const getRestaurants = useCallback(async () => {
    try {
      setIsGettingRestaurants(true)
      const querySnapshot = await firebase.firestore().collection('Restaurants').get()
      setRestaurants(querySnapshot.docs.reduce((acc, curr) => ({ ...acc, [curr.id]: curr.data().name || 'Unnamed' }), {}))
    }
    catch (error) {
      console.log('ManageDrawer getRestaurants error: ', error)
      dispatch(doAlertAdd('Failed to get restaurants', error.message))
    }
    finally {
      setIsGettingRestaurants(false)
    }
  }, [])

  return (
    <View style={{ zIndex: 99, overflow: 'hidden', flexDirection: 'row', position: 'absolute', top: 0, bottom: 0, left: 0, width: showDrawer ? '100%' : 0, }}>

      <View style={{
        flexDirection: 'row',
        backgroundColor: Colors.background,
      }}>
        <View style={styles.column}>
          <ManageItem text='Dietary table' onPress={() => navigation.navigate('Diets')} />
          <View>
            <ManageItem text='Unpaid bills' onPress={() => navigation.navigate('Unpaid')} />
            {!!numberUnpaid && <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, justifyContent: 'center' }}>
              <View style={{ backgroundColor: Colors.red, padding: 4, borderRadius: 30 }}>
                <MediumText bold>{numberUnpaid}</MediumText>
              </View>
            </View>}
          </View>
          <ManageItem text='Past bills' onPress={() => navigation.navigate('History')} />
          <View style={{ height: 30 }} />
          <ManageItem text='Analytics' isBold onPress={() => navigation.navigate('Analytics')} />
          <View style={{ flex: 1 }} />

          <ManageItem text='Sign out' onPress={() => dispatch(doAlertAdd('Sign out?', undefined, [
            {
              text: 'Yes',
              onPress: () => firebase.auth().signOut()
            },
            {
              text: 'No',
            }
          ]))} />
        </View>

        <View style={styles.column}>
          <ManageItem text='Edit menus' isBold onPress={() => navigation.navigate('Food')} />
          <ManageItem text='Edit restaurant' onPress={() => navigation.navigate('Restaurant')} />
          <ManageItem text='Edit hours' onPress={() => navigation.navigate('Hours')} />
          <ManageItem text='Edit tax rates' onPress={() => navigation.navigate('TaxRates')} />
          <ManageItem text='Edit printers' onPress={() => navigation.navigate('Printers')} />
          <ManageItem text='Edit tip options' onPress={() => navigation.navigate('Gratuity')} />
          <ManageItem text='Manage Torte' onPress={() => navigation.navigate('Torte')} />
          <View style={{ flex: 1 }} />
          <ManageItem text='Contact support' onPress={() => navigation.navigate('Support')} />

        </View>

        {isAdmin && <View style={[styles.column, { backgroundColor: Colors.red }]}>
          <ManageItem text='Sign up' isBold onPress={() => navigation.navigate('SignUp')} />
          <ManageItem text='Switcher' onPress={() => getRestaurants()} />
        </View>}
      </View>
      <TouchableWithoutFeedback onPress={animateCloseDrawer}>
        <View style={{ flex: 1, backgroundColor: Colors.black + 'DA' }} />
      </TouchableWithoutFeedback>

      {isGettingRestaurants && <IndicatorOverlay />}
      {!!restaurants && <View style={[StyleSheet.absoluteFill, { paddingVertical: Layout.window.width * 0.1, paddingHorizontal: Layout.window.width * 0.2, backgroundColor: Colors.black + 'DA' }]}>
        <FlatList
          ListHeaderComponent={() => <Header close backFn={() => setRestaurants(null)}>
            <ExtraLargeText center>Switch restaurant</ExtraLargeText>
          </Header>}
          contentContainerStyle={{ backgroundColor: Colors.background, flex: 1, borderColor: Colors.white, }}
          data={Object.keys(restaurants)}
          keyExtractor={item => item}
          renderItem={({ item: restaurant_id }) => <TouchableOpacity onPress={() => {
            if (restaurant_id === currentRestaurantID) setRestaurants(null)
            else {
              dispatch(doAppReset())
              dispatch(doAllStart(restaurant_id))
              setRestaurants(null)
              animateCloseDrawer()
            }
          }}>
            <View style={{ borderColor: Colors.white, borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 20, paddingHorizontal: 10, backgroundColor: restaurant_id === currentRestaurantID ? Colors.purple : undefined }}>
              <LargeText>{restaurants[restaurant_id]}</LargeText>
            </View>
          </TouchableOpacity>}
        />
      </View>}
    </View>
  )
}

const ManageItem = ({ text, onPress, isBold, }) => (
  <TouchableOpacity onPress={onPress}>
    <View style={{ paddingVertical: 10, marginTop: 20 }}>
      <ExtraLargeText style={{ fontWeight: isBold ? 'bold' : 'normal', }}>{text}</ExtraLargeText>
    </View>
  </TouchableOpacity>
)

const styles = StyleSheet.create({
  column: {
    paddingVertical: 10,
    paddingHorizontal: 40,
    borderColor: Colors.lightgrey,
    borderRightWidth: StyleSheet.hairlineWidth
  },

});

