const isHeaderDisabled = !__DEV__
const headerTouchable = async () => {
  // Linking.openURL('sms:&body=Test')
  // Linking.openURL('sms:&body=https%3A%2F%2Ftorteapp.com%2F%3Fr%3Dtestr%26b%3Dtestb')
}

import React, { useMemo, } from 'react';
import {
  Linking,
  StyleSheet,
  View,

} from 'react-native';
import { useDispatch, useSelector, } from 'react-redux';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Feather, MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import OpenBills from '../components/OpenBills';
import { BUTTON_SCALE } from '../constants/homeButtons';

import SafeView from '../../utils/components/SafeView';
import { DefaultText, SerifText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import Header from '../../utils/components/Header';
import { getAuth } from 'firebase/auth';
import firebaseApp from '../../firebase/firebase';

const auth = getAuth(firebaseApp)


export default function HomeScreen({ navigation, route }) {
  // const dispatch = useDispatch()
  // const test = useSelector(state => state.user.user)
  // console.log(test)
  const open_bills = useSelector(state => state.user.user.torte.open_bills)

  const settingButton = useMemo(() => (
    <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
      <Feather name="menu" size={34} color={Colors.white} />
    </TouchableOpacity>
  ), [])

  return <SafeView>
    <Header right={settingButton}>
      <TouchableOpacity disabled={isHeaderDisabled} containerStyle={{ flex: 1 }} onPress={headerTouchable}>
        <SerifText center>Torte</SerifText>
      </TouchableOpacity>
    </Header>

    {
      open_bills.length
        ? <View style={{ flexGrow: 4, margin: Layout.window.width * 0.1 }}>
          <OpenBills openBills={open_bills} />
        </View>
        : <View style={{ flexGrow: 4, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' }}>
          <TouchableOpacity
            style={[styles.buttonTouchable, { alignItems: 'center' }]}
            onPress={() => {
              navigation.navigate('Scan')
            }}
          >
            <LinearGradient
              colors={[Colors.green, Colors.purple]}
              style={styles.largeButtonCircle}
              start={[0.2, 0.1]}
              end={[0.65, 1.1]}>
              <MaterialCommunityIcons
                name='camera'
                size={Layout.window.height * BUTTON_SCALE * 1.3}
                color={Colors.white}
                style={{ marginTop: BUTTON_SCALE * 100 }}
              />
            </LinearGradient>
            <DefaultText maxScale={1.2} center style={styles.largeButtonTitle}>Scan QR code</DefaultText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.buttonTouchable, { alignItems: 'center' }]}
            onPress={() => {
              navigation.navigate('CodeRestaurant')
            }}
          >
            <LinearGradient
              colors={[Colors.red, Colors.purple]}
              style={styles.largeButtonCircle}
              start={[0.55, 0.1]}
              end={[0.25, 0.95]}>
              <Feather
                name='camera-off'
                size={Layout.window.height * BUTTON_SCALE * 1.17}
                color={Colors.white}
              />
            </LinearGradient>
            <DefaultText maxScale={1.2} center style={styles.largeButtonTitle}>No camera</DefaultText>
          </TouchableOpacity>
        </View>

    }

    <View style={styles.buttonContainer}>
      <MinorButton
        screen='OCR'
        iconBackgroundColor={Colors.white + 'E9'}
        iconName='receipt'
        iconColor={Colors.background}
        text='Non-Torte bills'
        subtext='Split any receipt!'
      />

      <MinorButton
        screen='Locations'
        iconBackgroundColor={Colors.red + 'E9'}
        iconName='location-on'
        text='Restaurants'
        subtext='Quickly explore menus'
      />

      {!!auth.currentUser && <MinorButton
        screen='Ledger'
        iconBackgroundColor={Colors.darkgrey + 'D9'}
        iconName='history'
        iconStyle={{ marginLeft: -22 * BUTTON_SCALE }}
        text='History'
        subtext='Find your old bills'
      />}
    </View>
  </SafeView >
}

const MinorButton = ({ iconColor = Colors.white, iconBackgroundColor, iconName, iconStyle = {}, text, subtext, screen }) => {
  const navigation = useNavigation()
  return (
    <TouchableOpacity style={{ marginVertical: BUTTON_SCALE * 80 }} onPress={() => navigation.navigate(screen)}>
      <View style={styles.buttonRow}>
        <View style={[styles.buttonCircle, { backgroundColor: iconBackgroundColor }]}>
          <MaterialIcons
            name={iconName}
            size={Layout.window.height * BUTTON_SCALE * 0.548}
            color={iconColor}
            style={iconStyle}
          />
        </View>

        <View style={styles.buttonTextContainer}>
          <View style={{ flex: 5 }} />
          <DefaultText maxScale={1.2} style={styles.buttonTitle}>{text}</DefaultText>
          <DefaultText maxScale={1.2} lightgrey maxFontSizeMultiplier={1.3} style={styles.buttonDescription}>{subtext}</DefaultText>
          <View style={{ flex: 8 }} />
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  buttonContainer: {
    flexGrow: 1,
    marginHorizontal: Layout.window.width * 0.1,
    paddingHorizontal: 12,
    alignSelf: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
  },
  largeButtonCircle: {
    height: Layout.window.height * BUTTON_SCALE * 2,
    width: Layout.window.height * BUTTON_SCALE * 2,
    borderRadius: Layout.window.height * BUTTON_SCALE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  buttonCircle: {
    marginRight: 20,
    height: Layout.window.height * BUTTON_SCALE * 0.8,
    width: Layout.window.height * BUTTON_SCALE * 0.8,
    borderRadius: Layout.window.height * BUTTON_SCALE * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonTextContainer: {
  },
  buttonTitle: {
    fontSize: 248 * BUTTON_SCALE,
  },
  buttonDescription: {
    marginTop: 1,
    fontSize: 160 * BUTTON_SCALE,
  },
  largeButtonTitle: {
    fontSize: 280 * BUTTON_SCALE,
  },
  largeButtonDescription: {
    marginTop: 1,
    color: Colors.lightgrey,
    fontSize: 200 * BUTTON_SCALE,
    textAlign: 'center'
  },
});