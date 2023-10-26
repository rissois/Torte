import React, { } from 'react';
import {
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LargeText, } from './NewStyledText';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';


export default function BottomButton({ text, onPress, backgroundColor, disabled, icon }) {
  const insets = useSafeAreaInsets()

  return (
    <TouchableOpacity onPress={onPress} disabled={disabled}>
      <View style={{ paddingBottom: insets.bottom, backgroundColor: backgroundColor || Colors.purple, paddingTop: 16 }}>
        {
          typeof text === 'string' ? <LargeText center bold>{text}</LargeText> : text
        }

        <LinearGradient
          start={[0, 0]}
          end={[0, 1]}
          style={{ position: 'absolute', top: -10, height: 10, left: 0, right: 0 }}
          colors={[Colors.black + '00', Colors.black + '6A']}
        />
      </View>
    </TouchableOpacity>
  )
}