import React, { useEffect } from 'react';
import {
  Keyboard,
} from 'react-native';
import { useSelector } from 'react-redux';
import PlatformAlert from './PlatformAlert';
import { useIsFocused } from '@react-navigation/native';




export default function MainAlert(props) {
  const alert = useSelector(state => state.alerts[0])
  const isFocused = useIsFocused()

  useEffect(() => {
    if (isFocused && alert) setTimeout(() => Keyboard.dismiss(), 20)
  }, [isFocused, alert])

  if (!alert) return null
  return <PlatformAlert {...alert} />
}


