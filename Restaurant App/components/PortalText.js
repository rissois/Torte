import React from 'react';
import { StyleSheet, Text } from 'react-native';
import Layout from '../constants/Layout';
import Colors from '../constants/Colors';

export function MainText(props) {
  return (
    <Text {...props} style={[{
      color: props.grey ? Colors.darkgrey : Colors.softwhite,
      fontSize: 24,
      ...props.shadow && { ...styles.shadow },
      ...props.center && { textAlign: 'center' }
    }, props.style]} />
  );
}

export function HeaderText(props) {
  return (
    <Text {...props} style={[{
      color: props.grey ? Colors.darkgrey : Colors.softwhite,
      fontSize: 34,
      ...props.shadow && { ...styles.shadow },
      ...props.center && { textAlign: 'center' }
    }, props.style]} />
  );
}

export function ClarifyingText(props) {
  return (
    <Text {...props} style={[{
      color: props.grey ? Colors.darkgrey : Colors.softwhite,
      fontSize: 18,
      ...props.shadow && { ...styles.shadow },
      ...props.center && { textAlign: 'center' }
    }, props.style]} />
  );
}

export function LargeText(props) {
  return (
    <Text {...props} style={[{
      color: props.grey ? Colors.darkgrey : Colors.softwhite,
      fontSize: 30,
      ...props.shadow && { ...styles.shadow },
      ...props.center && { textAlign: 'center' }
    }, props.style]} />
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,

    elevation: 6,
  }
})