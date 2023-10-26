import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Animated,
} from 'react-native';

import Colors from '../constants/Colors';

import {
  PanGestureHandler,
  TapGestureHandler,
  State,
} from 'react-native-gesture-handler';


export default function MultiSwitch({
  value,
  onChangeValue,
  options,
  colors = [Colors.lightgrey, Colors.green],
  size = 30,
  trackHeight = 22,
  style
}) {
  const width = size * options.length
  const [option] = useState(new Animated.Value(0))

  useEffect(() => {
    option.setValue(options.indexOf(value) * size)
  }, [value, options])

  return <View {...style}>
    <Animated.View key='track' style={{
      backgroundColor: option.interpolate({
        inputRange: [...Array(colors.length)].map((_, i) => size * i),
        outputRange: colors,
        extrapolate: 'clamp'
      }),
      height: trackHeight,
      borderRadius: trackHeight / 2,
      width,
    }} />

    <Animated.View key='ball' style={{
      position: 'absolute',
      left: option,
      top: (trackHeight - size) / 2,
      height: size,
      width: size,
      borderRadius: size / 2,
      backgroundColor: Colors.softwhite
    }} />

    <View style={{ position: 'absolute', top: (trackHeight - size) / 2, }}>
      <PanGestureHandler
        onHandlerStateChange={({ nativeEvent }) => {
          if (nativeEvent.state === State.BEGAN) {
            option.setOffset(nativeEvent.x - (size / 2))
          }
          if (nativeEvent.state === State.END) {
            let index = nativeEvent.x < 0 ? 0 : nativeEvent.x > width ? options.length - 1 : Math.floor(nativeEvent.x / size)
            option.setOffset(0)
            option.setValue(index * size)
            onChangeValue(options[index])
          }
        }}
        onGestureEvent={({ nativeEvent }) => {
          if (nativeEvent.x > 0 && nativeEvent.x < width)
            option.setValue(nativeEvent.translationX)
        }}
      >
        <View style={{ flexDirection: 'row', flex: 1, }}>
          {
            options.map((e, i) => {
              return <TapGestureHandler key={i} onHandlerStateChange={({ nativeEvent }) => {
                if (nativeEvent.state === State.END && value !== options[i]) {
                  option.setValue(i * size)
                  onChangeValue(options[i])
                }
              }}>
                <View style={{ height: size, width: size, }} />

              </TapGestureHandler>
            })
          }
        </View>
      </PanGestureHandler>
    </View>
  </View>
}