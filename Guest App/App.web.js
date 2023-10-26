// https://reactnavigation.org/docs/nesting-navigators

import React, { useMemo, } from 'react';
import {
  LogBox,
} from 'react-native';

import { createStore, applyMiddleware, compose } from 'redux';
import { Provider, } from 'react-redux'
import thunk from 'redux-thunk';
import reducers from './redux/reducers/reducer.js';
import AppNavigator from './navigators/screens/AppNavigator.js';


/*
npx react-native start
yarn web

expo build:web

web-build > index.html
REPLACE STYLES WITH THE BELOW

html, body { height: 100%;background-color: #19202D; }
body { overflow: hidden; }
#root { display:flex; height:100%; }

firebase deploy --only hosting

*/

function App() {
  // https://github.com/reduxjs/redux-devtools/tree/main/extension#installation
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  const store = useMemo(() => {
    return createStore(reducers, {}, composeEnhancers(applyMiddleware(thunk))) // params: monitoredReducer, initialState, enhancer
  }, [])

  return (
    <Provider store={store}>
      <AppNavigator />
    </Provider>
  );
}

export default App;