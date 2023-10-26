import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Image,
  ActivityIndicator,
} from 'react-native';
import Layout from '../constants/Layout';
import Colors from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, } from 'react-redux';
import { SerifText, LargeText, MediumText } from '../utils/components/NewStyledText';
import { selectListenersPending } from '../redux/selectors/selectorsListeners';

export default function ConnectScreen({ navigation, route }) {

  const insets = useSafeAreaInsets();

  const pending_listener = useSelector(selectListenersPending)

  useEffect(() => {
    if (!pending_listener) {
      // HANDLE NAVIGATION

      navigation.navigate('MainStack', { screen: 'Dashboard' })
    }
  }, [pending_listener])

  return (
    <View style={Layout.background}>
      <LinearGradient
        colors={[Colors.purple, Colors.green]}
        style={{ flex: 1 }}
        start={[0.1, 0.9]}
        end={[0.8, 0.1]}
      >
        <View style={{ flex: 1 }} />

        <View style={styles.logo}>
          <Image style={{ height: 200, width: 200 }} source={require('../assets/whiteLogo.png')} />
        </View>

        <View style={{ flex: 2, alignItems: 'center' }}>
          <View style={{ flex: 1, justifyContent: 'center', }}>
            <LargeText center maxFontSizeMultiplier={1.7}>Initializing Torte</LargeText>
            <MediumText center maxFontSizeMultiplier={1.7} style={{ marginBottom: 24, textAlign: 'center' }}>{pending_listener ? `Loading ${pending_listener}...` : 'Launching Torte...'}</MediumText>
            <ActivityIndicator color={Colors.white} animating size="large" />
          </View>



          <View style={{ marginBottom: insets.bottom + 8 }}>
            <SerifText>Torte</SerifText>
            {/* <SerifSmallText style={{ marginTop: Platform.OS === 'ios' ? -12 : 0, marginLeft: 1 }}>share a meal</SerifSmallText> */}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
