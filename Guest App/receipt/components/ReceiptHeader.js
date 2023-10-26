import React, { useMemo, } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { doReceiptEnd } from '../../redux/actions/actionsReceipt.web';
import Header from '../../utils/components/Header';
import Colors from '../../utils/constants/Colors';

export default function ReceiptHeader({ qr, text }) {
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const left = useMemo(() => {
    return <TouchableOpacity onPress={() => dispatch(doAlertAdd('Exit receipt?', text || undefined, [
      {
        text: 'Yes',
        onPress: () => {
          dispatch(doReceiptEnd())
          navigation.getParent().goBack()
        }
      },
      {
        text: 'No, cancel',
      }
    ]))}>
      <MaterialIcons name='home' size={30} color={Colors.white} />
    </TouchableOpacity>
  }, [])


  const right = useMemo(() => {
    return <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      {qr && <TouchableOpacity style={{ paddingHorizontal: 8 }} onPress={() => navigation.navigate('QR')}>
        <MaterialCommunityIcons name='qrcode' size={30} color={Colors.white} />
      </TouchableOpacity>}

      <TouchableOpacity style={{ paddingHorizontal: 8 }} onPress={() => navigation.navigate('Photo')}>
        <MaterialIcons name='photo' size={30} color={Colors.white} />
      </TouchableOpacity>
    </View>

  }, [])

  return <Header {...{ left, right }} />
}



const styles = StyleSheet.create({
});