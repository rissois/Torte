import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { TouchableOpacity, TouchableWithoutFeedback } from 'react-native-gesture-handler';

export default function DisablingScrollView(props) {
  let { children, style, contentContainerStyle, center = false, ...scrollView } = props
  const [contentHeight, setContentHeight] = useState(0)
  const [scrollViewHeight, setScrollViewHeight] = useState(0)

  return <ScrollView scrollEnabled={contentHeight > scrollViewHeight} {...scrollView} contentContainerStyle={{
    ...contentContainerStyle,
    ...(center && contentHeight <= scrollViewHeight) && { flex: 1, justifyContent: 'space-evenly' }
  }} style={{ ...style, }} onLayout={({ nativeEvent }) => {
    setScrollViewHeight(nativeEvent.layout.height)
  }}>
    <View onLayout={({ nativeEvent }) => {
      setContentHeight(nativeEvent.layout.height)
    }}>
      {children}
    </View>
  </ScrollView>
}