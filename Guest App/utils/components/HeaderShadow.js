import React from 'react';

import Colors from '../constants/Colors';
import {
  View,
  StyleSheet
} from 'react-native';

const x_offset = 20
const height = 4
const radius = 10

export default function HeaderShadow() {
  return <View style={styles.shadow} />
}


const styles = StyleSheet.create({
  shadow: {
    position: 'absolute',
    top: -(height + radius),
    left: -(x_offset + radius),
    right: -(x_offset + radius),
    height: height + radius,
    backgroundColor: Colors.black,

    shadowColor: "#000",
    shadowOffset: {
      width: x_offset / 2,
      height,
    },
    shadowOpacity: 0.25,
    shadowRadius: radius,

    elevation: 5,

  }
});
