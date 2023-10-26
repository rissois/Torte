
import React from 'react';
import {
  StyleSheet,
  View,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors'

export function CircleShadow(props) {
  let { borderRadius } = props

  return <View style={[styles.lighten, { borderRadius, ...props.style }]}>
    <View style={styles.topLeftShadow}>
      <View style={styles.bottomRightShadow}>
        {props.children}
      </View>
    </View>
  </View>
}

export default function TorteGradientLogo(props) {
  let { size } = props
  let topMargin = size / 2.9
  let bottomMargin = size / 4
  let borderRadius = (size + topMargin + bottomMargin) / 2

  return <View style={{ alignSelf: 'center' }}>
    <CircleShadow borderRadius={borderRadius}>
      <LinearGradient
        colors={[Colors.purple, Colors.green]}
        style={{
          borderRadius: (size + topMargin + bottomMargin) / 2,
        }}
        start={[0, 1]}
        end={[0.77, 0.17]}
      >
        <Image style={{
          height: size,
          width: size,
          marginTop: topMargin,
          marginBottom: bottomMargin,
          marginHorizontal: (topMargin + bottomMargin) / 2,
        }}
          source={require('../assets/whiteLogo.png')} />
      </LinearGradient>
    </CircleShadow>
  </View>
}

const styles = StyleSheet.create({
  lighten: {
    padding: 5,
    shadowColor: Colors.softwhite + '30',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.35,
    shadowRadius: 40,

    elevation: 13,
  },
  topLeftShadow: {
    shadowColor: Colors.black,
    shadowOffset: {
      width: -6,
      height: -11,
    },
    shadowOpacity: 0.8,
    shadowRadius: 5,

    elevation: 13,
  },
  bottomRightShadow: {
    shadowColor: Colors.black,
    shadowOffset: {
      width: 6,
      height: 11,
    },
    shadowOpacity: 0.9,
    shadowRadius: 5,

    elevation: 13,
  }
})

