// https://reactnavigation.org/docs/nesting-navigators

import React, { useMemo, } from 'react';
import {
  // LogBox,
  StatusBar,
} from 'react-native';

import { createStore, applyMiddleware } from 'redux';
import { Provider, } from 'react-redux'
import thunk from 'redux-thunk';

import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import reducers from './redux/reducers/reducer.js';

import RootStackScreen from './navigators/screens/RootStackScreen';

const AppStack = createStackNavigator();

function App() {
  const store = useMemo(() => {
    return createStore(reducers, {}, applyMiddleware(thunk)) // params: monitoredReducer, initialState, enhancer
  }, [])

  return (
    <Provider store={store}>
      <AppWithStore />
    </Provider>
  );
}

const AppWithStore = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <>
          <StatusBar barStyle="light-content" />
          <AppStack.Navigator initialRouteName="Splash" screenOptions={{ animationEnabled: false, headerShown: false }}>
            {
              <AppStack.Screen name="Root" component={RootStackScreen} />
            }
          </AppStack.Navigator>
        </>
      </NavigationContainer>
    </SafeAreaProvider>
  )
}



export default App;