import React, { } from 'react';
import {
  TouchableOpacity,
  View,
  Platform,
  Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LargeText, } from './NewStyledText';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import * as Device from 'expo-device';


export default function BottomButton({ text, onPress, backgroundColor, disabled, isOfflineVisible = false }) {
  const insets = useSafeAreaInsets()
  // const isMenuOnly = useIsMenuOnly()
  // const isRestaurantOffline = useIsRestaurantOffline()

  return (
    <View>
      {/* {isOfflineVisible && !isMenuOnly && isRestaurantOffline && <View style={{ backgroundColor: Colors.red, paddingVertical: 1 }}>
        <DefaultText center bold>Restaurant appears offline</DefaultText>
      </View>} */}
      <TouchableOpacity onPress={onPress} disabled={disabled}>
        <View style={{ paddingBottom: Platform.OS === 'ios' ? insets.bottom : 16, backgroundColor: backgroundColor || Colors.purple, paddingTop: 16 }}>
          {
            typeof text === 'string' ? <LargeText center bold>{text}</LargeText> : text
          }

        </View>
      </TouchableOpacity>
      <LinearGradient
        start={[0, 0]}
        end={[0, 1]}
        style={{ position: 'absolute', top: -10, height: 10, left: 0, right: 0 }}
        colors={[Colors.black + '00', Colors.black + '6A']}
      />
    </View>
  )
}