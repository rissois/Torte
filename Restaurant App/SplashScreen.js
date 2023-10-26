import React, from 'react';
import {
  StyleSheet,
  View,
  StatusBar,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Layout from '../constants/Layout';
import Colors from '../constants/Colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SerifText, SerifSmallText, DefaultText } from '../components/StyledText';


export default function SplashScreen(props) {
  const insets = useSafeAreaInsets();


  return (
    <View style={Layout.background}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.purple, Colors.red]}
        style={{ flex: 1 }}
        start={[0.1, 0.9]}
        end={[0.8, 0.1]}
      >

        <View style={{ flex: 1 }} />

        <View style={styles.logo}>
          <Image style={{ height: 200, width: 200 }} source={require('../assets/whiteLogo.png')} />
        </View>

        <View style={{ flex: 2, alignItems: 'center' }}>
          <View style={{ flex: 1, justifyContent: 'center' }}>
            <DefaultText style={{ marginBottom: 24 }}>Loading app</DefaultText>
            <ActivityIndicator color={Colors.white} animating size="large" />
          </View>

          <View style={{ marginBottom: insets.bottom + 8 }}>
            <SerifText>Torte</SerifText>
            <SerifSmallText style={{ marginTop: Platform.OS === 'ios' ? -12 : 0, marginLeft: 1 }}>share a meal</SerifSmallText>
          </View>
        </View>
      </LinearGradient>
    </View >
  );
}

const styles = StyleSheet.create({
  logo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
