import React, { useEffect, useState, } from 'react';
import {
  Animated,
} from 'react-native';

import Colors from '../constants/Colors';

const timing = {
  onDuration: 100,
  offDuration: 800,
  offDelay: 100,
  onDelay: 270,
}

export default function Cursor(props) {
  // NB: Price displayed is "Total" in database
  let { cursorOn, color = Colors.purple, noMargin = false } = props

  const [cursor] = useState(new Animated.Value(1))

  const animateCursor =
    Animated.loop(
      Animated.sequence([
        Animated.timing(
          cursor,
          {
            toValue: 0,
            duration: timing.offDuration,
            delay: timing.offDelay,
            useNativeDriver: false
          },
        ),
        Animated.timing(
          cursor,
          {
            toValue: 1,
            duration: timing.onDuration,
            delay: timing.onDelay,
            useNativeDriver: false
          },
        ),
      ])
    )

  useEffect(() => {
    if (cursorOn) {
      animateCursor.start()
    }
    else {
      animateCursor.stop()
      cursor.setValue(0)
    }
  }, [cursorOn]);



  return <Animated.View style={{
    flex: 1,
    marginLeft: noMargin ? 0 : 3,
    opacity: cursor,
    width: 2,
    backgroundColor: color,
  }} />
}

