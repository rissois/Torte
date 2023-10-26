import React, { useState, useEffect, useRef, useCallback, } from 'react';

import {
  StyleSheet,
  View,
  TouchableOpacity,
  Linking,
} from 'react-native';

import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';

import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';

import StyledButton from '../../utils/components/StyledButton';
import SafeView from '../../utils/components/SafeView';
import { LargeText } from '../../utils/components/NewStyledText';
import { useIsFocused } from '@react-navigation/native';
import { checkIsTorteURL, parseURL } from '../../navigators/functions/handleLinks.web';
import { useDispatch } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';



export default function ScanScreen({ navigation }) {
  const dispatch = useDispatch()
  const cameraRef = useRef(null);
  const isFocused = useIsFocused()

  const [cameraType] = useState(Camera.Constants.Type.back)
  const [cameraPermission, setCameraPermission] = useState(null)
  const [torch, setTorch] = useState(false)
  // const [isProcessingCode, setIsProcessingCode] = useState(false)

  // Check for camera permission
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestPermissionsAsync();
      setCameraPermission(status === 'granted');
    })();
  }, []);

  // useFocusEffect(useCallback(() => {
  //   setIsProcessingCode(false)
  // }, []))

  if (!cameraPermission) {
    return <SafeView unsafeColor={Colors.black}>
      <TouchableOpacity style={styles.iconPadding} onPress={() => {
        navigation.goBack()
      }}>
        <MaterialIcons
          name={"arrow-back"}
          size={30}
          color={Colors.white}
        />
      </TouchableOpacity>

      <View style={styles.missingPermissionView}>
        <LargeText maxScale={1.5} style={{ marginBottom: 12 }} center>We need access to your camera to scan the QR code for your table</LargeText>
        <LargeText maxScale={1.5} style={{ marginBottom: 12 }} center>You can grant permission in your phone's settings</LargeText>

        <StyledButton style={{ marginTop: 8 }} center text='Go to Settings' onPress={() => {
          Linking.openSettings()
        }} />
      </View>
    </SafeView>
  }


  return <SafeView unsafeColor={Colors.black}>
    <Camera style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      type={cameraType}
      ref={cameraRef}
      autoFocus={Camera.Constants.AutoFocus.on}
      flashMode={torch ? Camera.Constants.FlashMode.torch : Camera.Constants.FlashMode.off}
      barCodeScannerSettings={{
        barCodeTypes: [BarCodeScanner.Constants.BarCodeType.qr],
      }}
      // Prevent QR code scanning while processing or active code input
      onBarCodeScanned={({ data }) => {
        // setIsProcessingBarcode(true)
        if (isFocused) {
          if (!checkIsTorteURL(data)) return dispatch(doAlertAdd('This does not appear to be one of our QR codes.', 'You can only use Torte QR codes in the app'))
          const params = parseURL(data)
          if (!params.r) return dispatch(doAlertAdd('Link was not valid.', 'Please try again'))
          navigation.navigate('Link', params)
        }
      }}
    />

    <View style={[styles.iconPadding, styles.iconRow]}>
      <TouchableOpacity onPress={navigation.goBack}>
        <MaterialIcons
          name={"arrow-back"}
          size={30}
          color={Colors.white}
          style={styles.overlayShadow}
        />
      </TouchableOpacity>

      <TouchableOpacity onPress={() => {
        setTorch(!torch)
      }}>
        <MaterialCommunityIcons
          name={torch ? "lightbulb-on" : "lightbulb-on-outline"}
          size={30}
          color={cameraPermission ? Colors.white : Colors.darkgrey}
          style={styles.overlayShadow}
        />
      </TouchableOpacity>
    </View>

    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Layout.marHor }}>
      <MaterialCommunityIcons
        name='qrcode-scan'
        size={Layout.window.width * 0.5}
        color={Colors.white + '7A'}
        style={styles.overlayShadow}
      />
      <LargeText center shadow style={{ marginTop: 40 }}>Scan the QR code on your table</LargeText>
    </View>

    {/* {!!isProcessingBarcode && <IndicatorOverlay black text='Detected QR code' />} */}
  </SafeView>
}


const styles = StyleSheet.create({
  missingPermissionView: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40
  },

  iconPadding: {
    paddingHorizontal: 16,
  },

  overlayShadow: {
    textShadowColor: Colors.black,
    textShadowRadius: 5,
  },

  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
});
