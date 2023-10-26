import React, { useEffect } from 'react';

import { useDispatch, } from 'react-redux';
import { doUserChildrenUpdate, doUserStart, } from '../../redux/actions/actionsUser';

import { createStackNavigator } from '@react-navigation/stack';
import ConnectScreen from '../../home/screens/ConnectScreen';
import EulaScreen from './EulaScreen';
import MainStackScreen from './MainStackScreen';
import LinkScreen from './LinkScreen';
import { useIsMyAccountInitialized, } from '../../utils/hooks/useUser';
import auth from '@react-native-firebase/auth'
import { doAppReset } from '../../redux/actions/actionsApp';

const RootStack = createStackNavigator();

// Connect to user's Firebase and display Root-level modals
export default function RootStackScreen({ navigation, route }) {
  const dispatch = useDispatch()
  const isMyAccountInitialized = useIsMyAccountInitialized()

  useEffect(() => {
    const updateIsAdmin = async () => {
      try {
        const idTokenResult = await auth().currentUser.getIdTokenResult()
        dispatch(doUserChildrenUpdate('user', { is_admin: !!idTokenResult.claims?.is_admin }))
      }
      catch (error) {
        console.log('RootStackScreen updateIsAdmin error: ', error)
        dispatch(doUserChildrenUpdate('user', { is_admin: false }))
      }
    }

    var unsubscribe = auth().onIdTokenChanged(user => {
      dispatch(doAppReset())
      if (user?.uid) {
        dispatch(doUserStart())
        updateIsAdmin()
      }
    }, (error) => {
      console.log('App onAuthStateChanged error: ', error)
    })

    return unsubscribe
  }, [])

  return <RootStack.Navigator initialRouteName={"Connect"} screenOptions={{ gestureEnabled: false, headerShown: false, }}>
    {
      isMyAccountInitialized ? <RootStack.Group>
        <RootStack.Screen name="MainStack" component={MainStackScreen} options={{ animationEnabled: false, }} />
        <RootStack.Screen name="Eula" component={EulaScreen} options={{ animationEnabled: false, presentation: 'modal' }} />
        <RootStack.Screen name="Link" component={LinkScreen} options={{ animationEnabled: true, presentation: 'transparentModal' }} />
        {/* <RootStack.Screen name="Discount" component={DiscountScreen} options={{ animationEnabled: false, cardStyle: { backgroundColor: 'rgba(0,0,0,0.97)' } }} /> */}
      </RootStack.Group> :
        <RootStack.Screen name="Connect" component={ConnectScreen} options={{ animationEnabled: false }} />
    }
  </RootStack.Navigator>
}

