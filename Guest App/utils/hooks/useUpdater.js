import React, { useEffect, useState, useRef, } from 'react';
import {
  AppState,
} from 'react-native';
import { useDispatch } from 'react-redux';

import { handleUpdateOnAppActive } from '../../navigators/functions/handleUpdate';

export function useUpdater() {
  const dispatch = useDispatch()
  const appState = useRef(AppState.currentState);

  const [updateNotice, setUpdateNotice] = useState(null)


  // Can this be a callback?
  const handleForegrounding = async (nextAppState, isInitial) => {
    if (appState.current.match(/inactive|background/) && nextAppState === "active"
      || isInitial
    ) {
      // Only start link AFTER update check
      // Can store a time to limit to once a day...
      if (!__DEV__) {
        await handleUpdateOnAppActive(
          () => setUpdateNotice("We've made improvements! We are loading the newest version of Torte, your app will then automatically restart. We are sorry for the delay"),
          () => setUpdateNotice('Restarting Torte. See you in a second!'),
          dispatch
        )
      }
    }

    appState.current = nextAppState;
  }

  useEffect(() => {
    if (!__DEV__) {
      handleUpdateOnAppActive(
        () => setUpdateNotice("We've made improvements! We are loading the newest version of Torte, your app will then automatically restart. We are sorry for the delay"),
        () => setUpdateNotice('Restarting Torte. See you in a second!'),
        dispatch
      )
    }

    AppState.addEventListener("change", handleForegrounding);

    return () => {
      AppState.removeEventListener("change", handleForegrounding);
    };
  }, []);

  return updateNotice
}