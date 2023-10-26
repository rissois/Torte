// https://reactnavigation.org/docs/nesting-navigators

import React, { useState, useEffect, useMemo, } from 'react';
import auth from '@react-native-firebase/auth'
import {
  LogBox,
  Platform,
  StatusBar,
} from 'react-native';

import { createStore, applyMiddleware } from 'redux';
import { Provider, useSelector, } from 'react-redux'
import thunk from 'redux-thunk';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import AsyncStorage from '@react-native-async-storage/async-storage';
import dynamicLinks from '@react-native-firebase/dynamic-links';

import reducers from './redux/reducers/reducer.js';

import RootStackScreen from './navigators/screens/RootStackScreen';

import SplashScreen from './utils/screens/SplashScreen';

import SignUpScreen from './auth/screens/SignUpScreen';
import LogInScreen from './auth/screens/LogInScreen';
import ForgotScreen from './auth/screens/ForgotScreen';

import { StripeProvider } from '@stripe/stripe-react-native';
import { useIsStripeTestMode } from './utils/hooks/useApp.js';
import { selectConnectID, } from './redux/selectors/selectorsApp.js';

// Ignore all log notifications:
// LogBox.ignoreAllLogs();
LogBox.ignoreLogs(['Setting a timer'])

const AppStack = createStackNavigator();

function App() {
  const store = useMemo(() => {
    return createStore(reducers, {}, applyMiddleware(thunk)) // params: monitoredReducer, initialState, enhancer
  }, [])

  // Useful code to test state of store
  // useEffect(() => {
  //   const unsubscribe = store.subscribe(
  //     () => {
  //       console.log('State after dispatch: ', store.getState().trackers)
  //     }
  //   )

  //   return () => unsubscribe()
  // })

  return (
    <Provider store={store}>
      <AppWithStore />
    </Provider>
  );
}

// Required to survive automatic updates
const storeInitialUrl = async () => {
  console.log('App.js storeInitialUrl')
  const onLoadLink = await dynamicLinks().getInitialLink()
  console.log('App.js storeInitialUrl onLoadLink.url: ', onLoadLink?.url)
  if (onLoadLink?.url) {
    return await AsyncStorage.setItem('initial_url', onLoadLink.url)
  }
}

const checkIsReturningUser = async () => {
  return await AsyncStorage.getItem('is_signed_up')
}

const AppWithStore = () => {
  const [isLoadingApp, setIsLoadingApp] = useState(true)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  const [isReturningUser, setIsReturningUser] = useState(true)
  const [isUserAuthenticated, setIsUserAuthenticated] = useState(false)

  const connect_id = useSelector(selectConnectID)
  const isStripeTestMode = useIsStripeTestMode()

  useEffect(() => {
    Promise.all([
      storeInitialUrl().catch(error => {
        console.log('storeInitialUrl error: ', error)
      }),
      checkIsReturningUser().then(response => setIsReturningUser(response)).catch(error => {
        console.log('checkIsUserAuthenticated error: ', error)
      })
    ])
      .then(() => setIsLoadingApp(false))
  }, [])

  // useEffect(() => {
  //   const anonymousAuthentication = async () => {
  //     try {
  //       console.log('App.js anonymousAuthentication start')
  //       await auth().signInAnonymously()
  //       console.log('App.js anonymousAuthentication end')
  //     }
  //     catch (error) {
  //       console.log('App.js anonymousAuthentication error: ', error)
  //     }
  //   }

  //   if (Platform.OS === 'web') {
  //     anonymousAuthentication()
  //   }
  // }, [])

  // Listen for Google Authentication changes
  useEffect(() => {
    // NOTE: Can use onIdTokenChanged instead if you want to capture token changes
    var unsubscribe = auth().onAuthStateChanged(user => {
      if (user?.uid) {
        setIsUserAuthenticated(true)
      }
      else {
        setIsUserAuthenticated(false)
      }

      setIsLoadingUser(false)
    })

    return unsubscribe
  }, [])

  return (
    <StripeProvider
      publishableKey={
        isStripeTestMode ?
          '##############' :
          '##############'
      }
      merchantIdentifier="merchant.com.torte.torte"
      stripeAccountId={connect_id}
    >
      <SafeAreaProvider>
        <NavigationContainer>
          <>
            <StatusBar barStyle="light-content" />
            <AppStack.Navigator initialRouteName="Splash" screenOptions={{ animationEnabled: false, headerShown: false, }}>
              {
                isLoadingApp || isLoadingUser ? (
                  < AppStack.Screen name="Splash" component={SplashScreen} />
                ) :
                  isUserAuthenticated ? (
                    <AppStack.Screen name="Root" component={RootStackScreen} />
                  ) : (
                    // Auth Flow
                    isReturningUser ? (
                      // Log in first
                      <>
                        <AppStack.Screen name="LogIn" component={LogInScreen} />
                        <AppStack.Screen name="SignUp" component={SignUpScreen} />
                        <AppStack.Screen name="Forgot" component={ForgotScreen} />
                      </>
                    ) : (
                      // Sign up first
                      <>
                        <AppStack.Screen name="SignUp" component={SignUpScreen} />
                        <AppStack.Screen name="LogIn" component={LogInScreen} />
                        <AppStack.Screen name="Forgot" component={ForgotScreen} />
                      </>
                    )
                  )
              }
            </AppStack.Navigator>
          </>
        </NavigationContainer>
      </SafeAreaProvider>
    </StripeProvider>
  )
}



export default App;