import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  Linking,
  TouchableWithoutFeedback,
} from 'react-native';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { DefaultText, ExtraLargeText, LargeText, MediumText, SmallText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import QRCode from 'react-native-qrcode-svg';
import { useBillCode, useBillID, useRestaurantID, useTableName } from '../../utils/hooks/useBill';
import * as Device from 'expo-device';
import SafeView from '../../utils/components/SafeView';
import { useSelector } from 'react-redux';
import { selectReceiptID } from '../../redux/selectors/selectorsReceipt';

export default function QRScreen({ navigation, route }) {
  const isFirst = route?.params?.isFirst
  const restaurant_id = useRestaurantID()
  const bill_id = useBillID()
  const receipt_id = useSelector(selectReceiptID)
  const billCode = useBillCode()
  const tableName = useTableName()

  return <SafeView backgroundColor={Colors.black + 'F4'}>
    <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
      <View style={{ flex: 1 }}>
        {!!restaurant_id && <LargeText center style={{ paddingVertical: 10 }}>{tableName}</LargeText>}

        <View style={{ alignItems: 'center', paddingHorizontal: Layout.window.width * 0.2, marginTop: 30 }}>
          {!!restaurant_id && <ExtraLargeText bold center style={{ paddingBottom: 16 }}>#{billCode}</ExtraLargeText>}
          <LargeText center>Share this QR code with others at your table</LargeText>
          {!!isFirst && <SmallText center>if you need this QR code again{'\n'}it can be found on your bill's homepage</SmallText>}
          <View style={styles.qrcode}>
            <QRCode
              value={restaurant_id ? `https://torteapp.com/?r=${restaurant_id}&b=${bill_id}` : `https://torteapp.com/?receipt=${receipt_id}`}
              size={Layout.window.width * 0.4}
              color={Colors.white}
              backgroundColor={Colors.background}
            // ??? add logo in future
            />
          </View>
        </View>

        {/* 
    https://github.com/facebook/react-native/issues/23992
    https://stackoverflow.com/questions/36163903/react-native-linking-sms
       */}
        <MediumText center>- OR -</MediumText>
        <TouchableOpacity onPress={() => {
          // !!! NOTE: only valid for mobile devices
          // Device.manufacturer = Apple
          // Device.modelName = iPhone
          // Device.osName = iOS
          if (restaurant_id) Linking.openURL(`sms:${Device.manufacturer === 'Apple' ? '&' : '?'}body=https%3A%2F%2Ftorteapp.com%2F%3Fr%3D${restaurant_id}%26b%3D${bill_id}`)
          else Linking.openURL(`sms:${Device.manufacturer === 'Apple' ? '&' : '?'}body=https%3A%2F%2Ftorteapp.com%2F%3Freceipt%3D${receipt_id}`)
        }}>
          <MediumText center style={{ paddingVertical: 10, color: Colors.green }}>Send in a text message</MediumText>
        </TouchableOpacity>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <DefaultText center style={{ paddingVertical: 10 }}>(tap anywhere to close)</DefaultText>
        </View>
      </View>
    </TouchableWithoutFeedback>
  </SafeView>
}

const styles = StyleSheet.create({
  qrcode: {
    backgroundColor: Colors.background,
    marginVertical: 30,
    padding: Layout.window.width * 0.1,
    borderRadius: Layout.window.width * 0.3,
    borderWidth: 3,
    borderColor: Colors.green
  }
});