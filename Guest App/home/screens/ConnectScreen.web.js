import React, { } from 'react';
import {
  StyleSheet,
  View,
  Image,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { SerifText, } from '../../utils/components/NewStyledText';
import { LinearGradient } from 'expo-linear-gradient';
import IndicatorOverlay from '../../utils/components/IndicatorOverlay';
import SafeView from '../../utils/components/SafeView';
import { useSelector } from 'react-redux';

export default function ConnectScreen({ navigation }) {
  const isCreatingAccount = useSelector(state => state.user.user?.id && !state.user.user?.date_joined)

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
          <IndicatorOverlay opacity='00' text={isCreatingAccount ? 'Creating account\nPlease wait a moment' : 'Opening Torte...'} />
          <SerifText center>Torte</SerifText>
        </View>
      </SafeView>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  logo: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
