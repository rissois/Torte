// https://reactnavigation.org/docs/nesting-navigators

import React, { useState, useEffect, useCallback, } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth'
import {
} from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from '../../utils/screens/SplashScreen';

import firebaseApp from '../../firebase/firebase.js';
import { useDispatch, } from 'react-redux';
import { doUserStart } from '../../redux/actions/actionsUser';
import HomeScreen from '../../home/screens/HomeScreen';
import SplitScreen from '../../pay/screens/SplitScreen';
import PayScreen from '../../pay/screens/PayScreen';
import FeedbackScreen from '../../pay/screens/FeedbackScreen';
import { doAppReset } from '../../redux/actions/actionsApp';
import MainAlert from '../../utils/components/MainAlert';
import linking from '../constants/linking';
import ScanScreen from '../../home/screens/ScanScreen';
import CodeScreen from '../../home/screens/CodeScreen';
import LocationsScreen from '../../home/screens/LocationsScreen';
import LedgerScreen from '../../home/screens/LedgerScreen';
import LinkScreen from './LinkScreen';
import NameScreen from '../../home/screens/NameScreen';
import MenuScreen from '../../menu/screens/MenuScreen';
import OrderScreen from '../../order/screens/OrderScreen';
import CartScreen from '../../order/screens/CartScreen';
import BillScreen from '../../bill/screens/BillScreen';
import SettingsScreen from '../../home/screens/SettingsScreen';
import CardsScreen from '../../home/screens/CardsScreen';
import LoyaltyScreen from '../../home/screens/LoyaltyScreen';
import FAQScreen from '../../home/screens/FAQScreen';
import { navigationRef } from '../functions/AppNavigation';
import CodeRestaurantScreen from '../../home/screens/CodeRestaurantScreen';
import CodeTableScreen from '../../home/screens/CodeTableScreen';
import CodeBillScreen from '../../home/screens/CodeBillScreen';
import NoOrderScreen from '../../order/screens/NoOrderScreen';

import TestScreen, { isTesting, testScreenNames } from '../../testing/TestScreen.js';
import TestScreen2 from '../../testing/TestScreen2';
import TestScreen3 from '../../testing/TestScreen3';
import TestScreen4 from '../../testing/TestScreen4';
import OCRScreen from '../../home/screens/OCRScreen.web';
import ReceiptTabScreen from './ReceiptTabScreen';
import PhotoScreen from '../../home/screens/PhotoScreen';
import QRScreen from '../../home/screens/QRScreen';

const auth = getAuth(firebaseApp)

// https://medium.com/tribalscale/working-with-react-navigation-v5-firebase-cloud-messaging-and-firebase-dynamic-links-abf79bbef34e

const Stack = createStackNavigator();

function AppNavigator() {
  const dispatch = useDispatch()
  // const isMyAccountInitialized = useIsMyAccountInitialized()
  // const isWithAlert = useSelector(state => !!state.alerts?.length)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // NOTE: Can use onIdTokenChanged instead if you want to capture token changes
    var unsubscribe = onAuthStateChanged(auth, user => {
      //
      if (user?.uid) {
        dispatch(doUserStart())
      }
      else {
        dispatch(doAppReset())
      }
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  if (isLoading) return <SplashScreen />
  // if (!isMyAccountInitialized) return <ConnectScreen />

  return (
    <NavigationContainer ref={navigationRef} documentTitle={{ formatter: () => 'Torte', }} linking={linking}>
      <>
        <Stack.Navigator initialRouteName={isTesting ? testScreenNames[0] : 'Home'} screenOptions={{ animationEnabled: false, headerShown: false }}>
          {
            isTesting ?
              <Stack.Group>
                <Stack.Screen name={testScreenNames[0]} component={TestScreen} />
                <Stack.Screen name={testScreenNames[1]} component={TestScreen2} />
                <Stack.Screen name={testScreenNames[2]} component={TestScreen3} />
                <Stack.Screen name={testScreenNames[3]} component={TestScreen4} />
              </Stack.Group> :
              <Stack.Group>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Menu" component={MenuScreen} />
                <Stack.Screen name="Name" component={NameScreen} />
                <Stack.Screen name="Link" component={LinkScreen} options={{ presentation: 'transparentModal' }} />
                <Stack.Screen name="Scan" component={ScanScreen} />
                <Stack.Screen name="Cart" component={CartScreen} />
                <Stack.Screen name="Order" component={OrderScreen} />
                <Stack.Screen name="NoOrder" component={NoOrderScreen} />
                <Stack.Screen name="Code" component={CodeScreen} />
                <Stack.Screen name="CodeRestaurant" component={CodeRestaurantScreen} />
                <Stack.Screen name="CodeTable" component={CodeTableScreen} />
                <Stack.Screen name="CodeBill" component={CodeBillScreen} />
                <Stack.Screen name="Locations" component={LocationsScreen} />
                <Stack.Screen name="Ledger" component={LedgerScreen} />
                <Stack.Screen name="Split" component={SplitScreen} />
                <Stack.Screen name="Pay" component={PayScreen} />
                <Stack.Screen name="Feedback" component={FeedbackScreen} />
                <Stack.Screen name="Bill" component={BillScreen} />
                <Stack.Screen name="OCR" component={OCRScreen} />
                <Stack.Screen name="Settings" component={SettingsScreen} />
                <Stack.Screen name="Cards" component={CardsScreen} />
                <Stack.Screen name="Loyalty" component={LoyaltyScreen} />
                <Stack.Screen name="FAQ" component={FAQScreen} />
                <Stack.Screen name='ReceiptTab' component={ReceiptTabScreen} />
                <Stack.Screen name='QR' component={QRScreen} options={{ presentation: 'transparentModal' }} />
                <Stack.Screen name='Photo' component={PhotoScreen} />
              </Stack.Group>
          }

        </Stack.Navigator>
        <MainAlert />
      </>
    </NavigationContainer>
  );
}

export default AppNavigator