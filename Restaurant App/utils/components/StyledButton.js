import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import Colors from '../constants/Colors';
import { ExtraLargeText, LargeText, MediumText } from './NewStyledText';


export default function StyledButton(props) {

  return <TouchableOpacity
    disabled={props.disabled}
    style={[
      styles.button,
      {
        ...props.color && { backgroundColor: props.color },
        ...props.disabled && { backgroundColor: Colors.darkgrey },
        ...props.wide && { width: '100%' },
        ...props.center && { alignSelf: 'center' },
        ...props.style
      }
    ]}
    onPress={props.onPress}
  >
    {props.children}
    {
      props.small ?
        <MediumText center style={styles.text} maxFontSizeMultiplier={1.5} >{props.text}</MediumText> :
        <LargeText center style={styles.text} maxFontSizeMultiplier={1.5}>{props.text}</LargeText>
    }
  </TouchableOpacity>
}
const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.purple,
    borderRadius: 20,
    paddingHorizontal: 40,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.30,
    shadowRadius: 5.30,

    elevation: 7,
  },
})