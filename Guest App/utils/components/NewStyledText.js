import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';
import Colors from '../constants/Colors';

export function DefaultText(props) {
  // Default font size is 14

  return (
    <Text
      {...props}
      style={[
        { color: Colors.white },
        props.shadow && styles.shadow,
        props.red && styles.red,
        props.lightgrey && styles.lightgrey,
        props.darkgrey && styles.darkgrey,
        props.center && styles.center,
        props.bold && styles.bold,
        props.style
      ]}
    >
      {props.children}
    </Text>
  );
}


export function ExtraSmallText(props) {
  return <DefaultText {...props} style={[{ fontSize: 10 }, props.style]} />
}

export function SmallText(props) {
  return <DefaultText {...props} style={[{ fontSize: 12 }, props.style]} />
}

export function MediumText(props) {
  return <DefaultText {...props} style={[{ fontSize: 17 }, props.style]} />
}

export function LargeText(props) {
  return <DefaultText {...props} style={[{ fontSize: 20 }, props.style]} />
}

export function ExtraLargeText(props) {
  return <DefaultText {...props} style={[{ fontSize: 24 }, props.style]} />
}

export function SuperLargeText(props) {
  return <DefaultText {...props} style={[{ fontSize: 36 }, props.style]} />
}

export function SerifText(props) {
  return <DefaultText {...props} style={[{ fontSize: 36, fontFamily: Platform.OS === 'ios' ? 'Hiragino Mincho ProN' : 'serif' }, props.style]} />
}

const styles = StyleSheet.create({
  shadow: {
    textShadowColor: Colors.black,
    textShadowRadius: 4,
  },
  red: { color: Colors.red },
  lightgrey: { color: Colors.lightgrey },
  darkgrey: { color: Colors.darkgrey },
  white: { color: Colors.white },
  bold: { fontWeight: 'bold' },
  center: { textAlign: 'center' },
});