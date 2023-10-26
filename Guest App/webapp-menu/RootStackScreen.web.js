import React from 'react';


import { createStackNavigator } from '@react-navigation/stack';
import EulaScreen from './EulaScreen';
import MainStackScreen from './MainStackScreen';
import LinkScreen from './LinkScreen';


const RootStack = createStackNavigator();

// Connect to user's Firebase and display Root-level modals
export default function RootStackScreen({ navigation, route }) {
  return <RootStack.Navigator initialRouteName={"Connect"} screenOptions={{ gestureEnabled: false, headerShown: false, presentation: 'modal' }}>
    {
      <RootStack.Group>
        <RootStack.Screen name="MainStack" component={MainStackScreen} options={{ animationEnabled: false, }} />
        <RootStack.Screen name="Eula" component={EulaScreen} options={{ animationEnabled: false }} />
        {/* <RootStack.Screen name="Link" component={LinkScreen} options={{ animationEnabled: true, cardStyle: { backgroundColor: 'transparent' } }} /> */}
      </RootStack.Group>
    }
  </RootStack.Navigator>
}

