import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import Colors from '../constants/Colors';
import { ExtraLargeText, MediumText } from './NewStyledText';


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
    {
      props.small ?
        <MediumText center style={styles.text} maxFontSizeMultiplier={1.5} style={{ marginVertical: 4 }}>{props.text}</MediumText> :
        <ExtraLargeText center style={styles.text} maxFontSizeMultiplier={1.5}>{props.text}</ExtraLargeText>
    }
  </TouchableOpacity>
}
const styles = StyleSheet.create({
  button: {
    backgroundColor: Colors.purple,
    borderRadius: 48,
    paddingVertical: 8,
    paddingHorizontal: 50,
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