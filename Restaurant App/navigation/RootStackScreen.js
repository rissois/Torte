import React, { useEffect, } from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import ConnectScreen from '../screens/ConnectScreen'

import { useDispatch } from 'react-redux';
import firebase from 'firebase';

import MainStackScreen from './MainStackScreen';
import { useRestaurantID } from '../utils/hooks/useRestaurant';
import SignUpScreen from '../screens/SignUpScreen';
import { doAllStart, } from '../redux/actions/actionsAll';
import { doAppIsAdmin, doAppReset } from '../redux/actions/actionsApp';

const RootStack = createStackNavigator();

export default function RootStackScreen({ navigation, route }) {
  const restaurant_id = useRestaurantID()
  const dispatch = useDispatch()

  useEffect(() => {
    const updateIsAdmin = async () => {
      try {
        const idTokenResult = await firebase.auth().currentUser.getIdTokenResult()
        dispatch(doAppIsAdmin(!!idTokenResult.claims?.is_admin))
      }
      catch (error) {
        console.log('RootStackScreen updateIsAdmin error: ', error)
        dispatch(doAppIsAdmin(false))
      }
    }

    var unsubscribe = firebase.auth().onIdTokenChanged(user => {
      dispatch(doAppReset())
      navigation.navigate('Connect')
      if (user?.uid) {
        dispatch(doAllStart(user?.uid))
        updateIsAdmin()
      }
    }, (error) => {
      console.log('App onAuthStateChanged error: ', error)
    })

    return () => unsubscribe()
  }, [])

  return (
    <RootStack.Navigator
      initialRouteName='Connect'
      screenOptions={() => ({
        gestureEnabled: false,
        presentation: 'modal',
        headerShown: false,
      })}
    >
      <RootStack.Screen name="Connect" component={ConnectScreen} options={{ animationEnabled: false }} />
      <RootStack.Screen name="SignUp" component={SignUpScreen} options={{ animationEnabled: false }} />
      <RootStack.Screen name='MainStack' component={MainStackScreen} options={{ animationEnabled: false }} />
    </RootStack.Navigator>
  )
}