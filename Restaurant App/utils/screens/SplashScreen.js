import React from 'react';
import {
  StyleSheet,
  View,
  Image,
  Platform,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import Colors from '../constants/Colors';
import { SerifText, } from '../components/NewStyledText';
import SafeView from '../components/SafeView';
import IndicatorOverlay from '../components/IndicatorOverlay';



export default function SplashScreen(props) {
  return (
    <LinearGradient
      colors={[Colors.purple, Colors.green]}
      style={{ flex: 1 }}
      start={[0.1, 0.9]}
      end={[0.8, 0.1]}
    >
      <SafeView backgroundColor={null}>
        <View style={{ flex: 1 }} />

        <View style={styles.logo}>
          <Image style={{ height: 200, width: 200 }} source={require('../../assets/images/whiteLogo.png')} />
        </View>

        <View style={{ flex: 2, alignItems: 'center', justifyContent: 'flex-end' }}>
          <IndicatorOverlay opacity='00' text={Platform.OS === 'native' ? 'Loading app' : 'Installing app'} />
          <SerifText center>Torte</SerifText>
        </View>
      </SafeView>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  logo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
