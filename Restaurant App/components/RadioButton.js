import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import Colors from '../constants/Colors'


export default function RadioButton(props) {
  let { on, color = Colors.softwhite, textRight = true } = props
  return (
    <View style={[styles.outline, { borderColor: color, marginRight: textRight ? 16 : 0 },]}>
      {on && <View style={[styles.fill, { backgroundColor: color }]} />}
    </View>
  );
}

const styles = StyleSheet.create({
  outline: {
    width: 20,
    height: 20,
    borderRadius: 20,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center'
  },
  fill: {
    width: 10,
    height: 10,
    borderRadius: 10,
  }
});