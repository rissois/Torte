import React, { useEffect, useState, } from 'react';
import {
  Animated,

} from 'react-native';



import Colors from '../constants/Colors';
import Layout from '../constants/Layout';


export default function Cursor(props) {
  // NB: Price displayed is "Total" in database
  let { cursorOn, color = Colors.purple } = props

  const [cursor] = useState(new Animated.Value(1))

  const animateCursor =
    Animated.loop(
      Animated.sequence([
        Animated.timing(
          cursor,
          {
            toValue: 0,
            duration: Layout.cursor.offDuration,
            delay: Layout.cursor.offDelay,
            useNativeDriver: false
          },
        ),
        Animated.timing(
          cursor,
          {
            toValue: 1,
            duration: Layout.cursor.onDuration,
            delay: Layout.cursor.onDelay,
            useNativeDriver: false
          },
        ),
        // Animated.timing(
        //   cursor,
        //   {
        //     toValue: 0,
        //     duration: Layout.cursor.onDelay,
        //   }
        // )
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



  return (

    <Animated.View style={{ marginLeft: 3, width: 2, backgroundColor: color, opacity: cursor, height: '100%' }} />

  )
}

