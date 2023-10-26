import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';

import dynamicLinks from '@react-native-firebase/dynamic-links';

import HomeScreen from '../../home/screens/HomeScreen';
import SettingsScreen from '../../home/screens/SettingsScreen';
import FAQScreen from '../../home/screens/FAQScreen';

import ScanScreen from '../../home/screens/ScanScreen';
import CodeScreen from '../../home/screens/CodeScreen'
import MenuScreen from '../../menu/screens/MenuScreen';
import CartScreen from '../../order/screens/CartScreen';
import OrderScreen from '../../order/screens/OrderScreen';


import LoyaltyScreen from '../../home/screens/LoyaltyScreen';
import LocationsScreen from '../../home/screens/LocationsScreen';
import LedgerScreen from '../../home/screens/LedgerScreen';


import MainAlert from '../../utils/components/MainAlert';
import BillScreen from '../../bill/screens/BillScreen';
import PayScreen from '../../pay/screens/PayScreen';
import SplitScreen from '../../pay/screens/SplitScreen';
import CardsScreen from '../../home/screens/CardsScreen';
import FeedbackScreen from '../../pay/screens/FeedbackScreen';
import { handleUpdateOnAppActive } from '../functions/handleUpdate';
import Layout from '../../utils/constants/Layout';
import Colors from '../../utils/constants/Colors';


const MainStack = createStackNavigator();

export default function MainStackScreen({ navigation, route }) {
  // const appState = useRef(AppState.currentState);



  // const handleLinksOnAppActive = async () => {
  //   try {
  //     const url = await retrieveInitialURL()
  //     if (url) {
  //       navigation.navigate('Link', { url })
  //     }
  //   }
  //   catch (error) {
  //     console.log('MainStackScreen handleLinksOnAppActive error: ', error)
  //     dispatch(doAlertAdd('Unable to open link', 'Please try again and let us know if the issue persists.'))
  //   }
  // }


  // const handleLinksWhileActive = async (link) => {
  //   try {
  //     if (link.url) {
  //       navigation.navigate('Link', { url: link.url })
  //     }
  //   }
  //   catch (error) {
  //     console.log('MainStackScreen handleLinksWhileActive error: ', error)
  //     dispatch(doAlertAdd('Unable to open link', 'Please try again and let us know if the issue persists.'))
  //   }
  // }

  // useEffect(() => {
  // Listen for links while app is in foreground...
  // ... I don't really know if you receive any dynamic links while the app is foregrounded
  //   const unsubscribe = dynamicLinks().onLink(handleLinksWhileActive)

  //   if (unsubscribe) {
  //     return () => unsubscribe();
  //   }
  // }, [])




  return (
    <>
      <MainStack.Navigator initialRouteName="Home"
        screenOptions={{
          headerShown: false,
          gestureEnabled: false,
          // cardStyle: { height: Layout.window.height, backgroundColor: Colors.backgroundColor }
        }}
      >
        <MainStack.Screen name="Home" component={HomeScreen} options={({ navigation }) => {
          return { headerShown: false, }
        }} />
        <MainStack.Screen name="Menu" component={MenuScreen} />
        <MainStack.Screen name="Code" component={CodeScreen} options={{ gestureEnabled: true }} />
        <MainStack.Screen name="Locations" component={LocationsScreen} />
      </MainStack.Navigator>

      {/* WEBAPP: Check is_[blank]_disabled before displaying Torte download discount… or “at participating restaurants, not valid for _____” */}

      <MainAlert />
    </>
  )
}

