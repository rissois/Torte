import React from 'react';
import { useSelector } from 'react-redux';
import PlatformAlert from './PlatformAlert';


export default function MainAlert(props) {
  const alert = useSelector(state => state.alerts[0])

  if (!alert) return null
  return <PlatformAlert {...alert} />
}


