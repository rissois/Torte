import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  View,
} from 'react-native';

import Colors from '../constants/Colors';
import { DefaultText, LargeText } from './NewStyledText';

export default function IndicatorOverlay(props) {
  /*
    PROPS LIST:

    Background color
      default: Colors.background
      black: Colors.black
      opacity: Hexidecimal value
      backgroundColor: Other background color
    Text color
      default: Colors.white
      dark: Colors.darkgrey
    Layout
      default: large indicator with text below
      horizontal / small: small indicator with text to right
  */

  if (props.horizontal || props.small) {
    return <View style={[styles.position, { flexDirection: 'row', backgroundColor: (props.black ? Colors.black : props.backgroundColor || Colors.background) + (props.opacity || 'DA') }]}>
      <ActivityIndicator size='small' color={props.dark ? Colors.darkgrey : Colors.white} />
      {!!props.text && <View style={{ marginLeft: 12 }}>
        <DefaultText center {...props.dark && { darkgrey: true }}>{props.text}</DefaultText>
      </View>}
    </View>
  }

  return <View style={[styles.position, { backgroundColor: (props.black ? Colors.black : props.backgroundColor || Colors.background) + (props.opacity || 'DA') }]}>
    <ActivityIndicator size='large' color={props.dark ? Colors.darkgrey : Colors.white} />
    {!!props.text && <View style={{ marginTop: 12, marginHorizontal: 40 }}>
      <LargeText center {...props.dark && { darkgrey: true }}>{props.text}</LargeText>
    </View>}
  </View>
}

const styles = StyleSheet.create({
  position: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

