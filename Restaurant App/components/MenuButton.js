import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import Colors from '../constants/Colors'
import Layout from '../constants/Layout'
import { MainText, } from '../components/PortalText'


export default function MenuButton(props) {
  let { text = 'Missing text', color = Colors.purple, buttonFn = () => { }, minWidth = true, disabled = false } = props

  return (
    <TouchableOpacity disabled={disabled} style={[{ alignSelf: 'center' }, props.style]} onPress={() => { buttonFn() }}>
      <View style={[styles.button, {
        backgroundColor: color,
        ...minWidth && { minWidth: Layout.window.width * 0.25 },
      }]}>
        <MainText style={styles.buttonText}>{text}</MainText>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 20,
    paddingHorizontal: 40,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.39,
    shadowRadius: 8.30,

    elevation: 13,
  },
  buttonText: {
    textAlign: 'center',
    letterSpacing: 1
  }
});
