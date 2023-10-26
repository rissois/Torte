const isTesting = false

import React, { useState, useEffect, useMemo } from 'react';
import {
  Alert,
  LogBox,
  StyleSheet,
  StatusBar,
} from 'react-native';

import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import reducer from './redux/reducers/reducer.js';
import { Provider, useDispatch, useSelector, } from 'react-redux'
import { SafeAreaProvider } from 'react-native-safe-area-context';


import { NavigationContainer, } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import firebase from './config/Firebase';
import LogInScreen from './screens/LogInScreen.js';
import PasswordResetScreen from './screens/PasswordResetScreen.js';
import SplashScreen from './utils/screens/SplashScreen';

// import * as SplashScreen from 'expo-splash-screen';
import RootStackScreen from './navigation/RootStackScreen.js';
import TestingScreen from './screens/TestingScreen.js';
import StripeTerminal from 'react-native-stripe-terminal'

const AppStack = createStackNavigator();

// Ignore all log notifications:
// LogBox.ignoreAllLogs()
LogBox.ignoreLogs([
  'ReactNativeFiberHostComponent: Calling getNode() on the ref of an Animated component is no longer necessary. You can now directly use the ref instead. This method will be removed in a future release.',
  'VirtualizedLists should never be nested',
  `AsyncStorage has been extracted from react-native core and will be removed in a future release. It can now be installed and imported from '@react-native-async-storage/async-storage' instead of 'react-native'. See https://github.com/react-native-async-storage/async-storage`,
]);

function App() {
  const store = useMemo(() => {
    return createStore(reducer, {}, applyMiddleware(thunk)) // params: monitoredReducer, initialState, enhancer
  }, [])

  // Useful code to test state of store
  // useEffect(() => {
  //   const unsubscribe = store.subscribe(
  //     () => {
  //       console.log('State after dispatch: ', store.getState())
  //     }
  //   )

  //   return () => unsubscribe()
  // })

  if (isTesting) return <TestingScreen />

  return (
    <Provider store={store}>
      <AppWithStore />
    </Provider>
  );
}

const AppWithStore = () => {
  const isTestBill = useSelector(state => true)
  const [isLoadingRestaurant, setIsLoadingRestaurant] = useState(true)

  const [isRestaurantAuthenticated, setIsRestaurantAuthenticated] = useState(false)

  useEffect(() => {
    StripeTerminal.initialize({
      fetchConnectionToken: async () => {
        const { data: { secret } } = await firebase.functions().httpsCallable('stripeTerminal-stripeTerminalConnectionToken')({ is_test: isTestBill })
        return secret
      }
    })
  }, [isTestBill])

  // Listen for Google Authentication changes
  useEffect(() => {
    // NOTE: Can use onIdTokenChanged instead if you want to capture token changes
    var unsubscribe = firebase.auth().onAuthStateChanged(user => {
      if (user?.uid) {
        setIsRestaurantAuthenticated(true)
      }
      else {
        setIsRestaurantAuthenticated(false)
      }
      setIsLoadingRestaurant(false)
    }, (error) => {
      console.log('App onAuthStateChanged error: ', error)
    })

    return () => unsubscribe()
  }, [])

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <>
          <StatusBar barStyle="light-content" />
          <AppStack.Navigator initialRouteName="Splash" screenOptions={{ animationEnabled: false, headerShown: false }}>
            {
              isLoadingRestaurant || (Platform.OS === 'web' && !isRestaurantAuthenticated) ? (
                < AppStack.Screen name="Splash" component={SplashScreen} />
              ) :
                isRestaurantAuthenticated ? (
                  <AppStack.Screen name="Root" component={RootStackScreen} />
                ) : (
                  <>
                    <AppStack.Screen name="LogIn" component={LogInScreen} />
                    <AppStack.Screen name="PasswordReset" component={PasswordResetScreen} />
                  </>
                )
            }
          </AppStack.Navigator>
        </>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}



export default App;
