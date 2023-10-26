import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ActivityIndicator
} from 'react-native';
import { LargeText } from './PortalText';
import { useHeaderHeight } from '@react-navigation/stack'


// If opacity, assume full window and move the activity indicator up by half the header height

export default function RenderOverlay(props) {
  const headerHeight = useHeaderHeight()
  const { text, opacity = 0 } = props
  return <View
    style={[
      StyleSheet.absoluteFill,
      {
        backgroundColor: `rgba(0,0,0,${opacity})`,
        alignItems: 'center',
        justifyContent: 'center',
      },
    ]}>
    <LargeText maxFontSizeMultiplier={1.7} style={{ textAlign: 'center', marginTop: opacity ? -headerHeight / 2 : 0, marginBottom: 24, marginHorizontal: 40 }}>{text}</LargeText>
    <ActivityIndicator color="#fff" animating size="large" />
  </View>
}