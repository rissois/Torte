import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Alert,
  MailComposer,
  Platform,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';

import { DefaultText, } from '../../utils/components/NewStyledText';
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


import { retrieveInitialURL } from '../functions/handleLinks';
import MainAlert from '../../utils/components/MainAlert';
import BillScreen from '../../bill/screens/BillScreen';
import PayScreen from '../../pay/screens/PayScreen';
import SplitScreen from '../../pay/screens/SplitScreen';
import CardsScreen from '../../home/screens/CardsScreen';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import FeedbackScreen from '../../pay/screens/FeedbackScreen';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { selectIsEULANeeded } from '../../redux/selectors/selectorsApp';
import { useUpdater } from '../../utils/hooks/useUpdater';
import { useFocusEffect } from '@react-navigation/native';



const MainStack = createStackNavigator();

export default function MainStackScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const {
    is_blocked,
    is_down_for_maintenance, //Get these from a different Torte document?
    discounts = {},
  } = useSelector(state => state.user.user)
  const { seen_discounts = [], } = useSelector(state => state.app)

  const isEULANeeded = useSelector(selectIsEULANeeded)

  const updateNotice = useUpdater()
  const [isInitialLinkHandled, setIsInitialLinkHandled] = useState(false)


  const handleLinks = async (link) => {
    console.log('MainStackScreen HANDLELINKS: ', link)
    try {
      navigation.navigate('Link', { url: link.url || link })
    }
    catch (error) {
      dispatch(doAlertAdd('Unable to open link', 'Please try again and let us know if the issue persists.'))
    }
  }

  const handleInitialLinks = useCallback(async () => {
    console.log('HANDLE INITIAL LINK')
    // Prevent further calls
    setIsInitialLinkHandled(true)

    try {
      const storedURL = await AsyncStorage.getItem('initial_url')
      if (storedURL) {
        await AsyncStorage.removeItem('initial_url')
        console.log('STORED URL: ', storedURL)
        // handleLinks(storedURL)
        return
      }

      const linkingURL = await Linking.getInitialURL()
      if (linkingURL) {
        console.log('LINKING URL: ', linkingURL)
        handleLinks(linkingURL)
        return
      }

      const dynamicURL = await dynamicLinks().getInitialLink()
      if (dynamicURL) {
        console.log('DYNAMIC URL: ', dynamicURL)
        // handleLinks(dynamicURL)
        return
      }
    }
    catch (error) {
      console.log('MainStackScreen INITIAL LINK ERROR: ', error)
    }
  }, [])

  useFocusEffect(useCallback(() => {
    if (isEULANeeded) navigation.navigate('Eula')
    else if (!isInitialLinkHandled) handleInitialLinks()
  }, [isEULANeeded, isInitialLinkHandled]))

  useEffect(() => {
    const unsubscribe = Platform === 'ios' ? Linking.addEventListener('url', handleLinks) : dynamicLinks().onLink(handleLinks)

    if (unsubscribe) {
      return () => unsubscribe();
    }
  }, [])






  useEffect(() => {
    // if (!!Object.keys(discounts).find(id => !seen_discounts.includes(id))) {
    //   console.log('going to discount')
    //   navigation.navigate('Discount')
    // }
  }, [discounts, seen_discounts,])

  if (is_blocked) {
    return (
      <SafeView>
        <View style={{ width: Layout.window.width * 0.6, alignSelf: 'center', justifyContent: 'center' }}>
          <DefaultText center>We have detected unusual activity and have frozen this account.</DefaultText>
          <DefaultText />
          <DefaultText center>Please contact Torte Support at <DefaultText style={{ color: Colors.red }} onPress={async () => {
            let response = await MailComposer.composeAsync({
              recipients: ['support@tortepay.com'],
              subject: 'Frozen account'
            }).catch(error => Alert.alert('Cannot open email app', 'Sorry, please send an email to support@tortepay.com'))
          }}>support@tortepay.com</DefaultText></DefaultText>
        </View>
      </SafeView>
    )
  }

  if (is_down_for_maintenance) {
    return (
      <SafeView>
        <View style={{ width: Layout.window.width * 0.6, alignSelf: 'center', justifyContent: 'center' }}>
          <DefaultText center>Torte is currently down for maintenance. We apologize for the inconvenience</DefaultText>
        </View>
      </SafeView>
    )
  }


  return (
    <>
      <MainStack.Navigator initialRouteName="Home"
        screenOptions={() => ({
          headerShown: false,
          gestureEnabled: false,
        })}
      >
        <MainStack.Screen name="Home" component={HomeScreen} options={({ navigation }) => {
          return { headerShown: false }
        }
        } />
        <MainStack.Screen name="FAQ" component={FAQScreen} options={{ gestureEnabled: true }} />
        <MainStack.Screen name="Settings" component={SettingsScreen} options={{ gestureEnabled: true }} />
        <MainStack.Screen name="Menu" component={MenuScreen} />
        <MainStack.Screen name="Cart" component={CartScreen} />
        <MainStack.Screen name="Cards" component={CardsScreen} />
        <MainStack.Screen name="Order" component={OrderScreen} />
        <MainStack.Screen name="Bill" component={BillScreen} />
        <MainStack.Screen name="Loyalty" component={LoyaltyScreen} options={{ gestureEnabled: true }} />
        <MainStack.Screen name="Scan" component={ScanScreen} options={{ gestureEnabled: true }} />
        <MainStack.Screen name="Pay" component={PayScreen} />
        <MainStack.Screen name="Split" component={SplitScreen} />
        <MainStack.Screen name="Code" component={CodeScreen} options={{ gestureEnabled: true }} />
        <MainStack.Screen name="Ledger" component={LedgerScreen} options={{ gestureEnabled: true }} />
        <MainStack.Screen name="Locations" component={LocationsScreen} />
        <MainStack.Screen name="Feedback" component={FeedbackScreen} />
      </MainStack.Navigator>

      <MainAlert />
      {!!updateNotice && <IndicatorOverlay text={updateNotice} black />}
    </>
  )
}

