import React, { } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

import Colors from '../../utils/constants/Colors';
import { LargeText, } from '../../utils/components/NewStyledText';



export default function CodeConfirm({ disabled, onPress }) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
    >
      <LargeText center style={{ color: disabled ? Colors.darkgrey : Colors.green }}>CONFIRM</LargeText>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({

});

