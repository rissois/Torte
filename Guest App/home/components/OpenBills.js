import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { useDispatch, } from 'react-redux';
import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import { DefaultText, LargeText, SerifText, } from '../../utils/components/NewStyledText';
import { doRestaurantStart } from '../../redux/actions/actionsRestaurants';
import CenteredScrollView from '../../utils/components/CenteredScrollView';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useNavigation, } from '@react-navigation/native';
import { doBillStart } from '../../redux/actions/actionsBill';
import OpenBill from './OpenBill';
import { BUTTON_SCALE } from '../constants/homeButtons';


export default function OpenBills({ openBills = [], }) {
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const viewBill = useCallback((restaurant_id, bill_id) => {
    dispatch(doBillStart(restaurant_id, bill_id))
    dispatch(doRestaurantStart(restaurant_id))
    navigation.navigate('Order')
  }, [])

  return <CenteredScrollView
    main={<View>
      <SerifText style={{ fontSize: 30 }} center>OPEN BILLS</SerifText>
      <View style={{ marginVertical: 20 }}>
        {openBills.map(bill => <OpenBill key={bill.bill_id} viewBill={viewBill} {...bill} />)}
      </View>
    </View>}
    secondary={<View>
      <View style={{ flexDirection: 'row', margin: 16, alignItems: 'center' }}>
        <View style={{ flex: 1, borderColor: Colors.white, borderWidth: StyleSheet.hairlineWidth }} />
        <DefaultText>     or     </DefaultText>
        <View style={{ flex: 1, borderColor: Colors.white, borderWidth: StyleSheet.hairlineWidth }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' }}>
        <TouchableOpacity
          style={[styles.buttonTouchable, { alignItems: 'center' }]}
          onPress={() => {
            navigation.navigate('Scan')
          }}
        ><DefaultText>Scan QR code</DefaultText></TouchableOpacity>
        <TouchableOpacity
          style={[styles.buttonTouchable, { alignItems: 'center' }]}
          onPress={() => {
            navigation.navigate('Code')
          }}
        ><DefaultText>No camera</DefaultText></TouchableOpacity>
      </View>
    </View>}
  />
}

const styles = StyleSheet.create({
  buttonCircle: {
    marginRight: 20,
    height: Layout.window.height * BUTTON_SCALE * 0.8,
    width: Layout.window.height * BUTTON_SCALE * 0.8,
    borderRadius: Layout.window.height * BUTTON_SCALE * 0.4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  buttonTitle: {
    fontSize: 248 * BUTTON_SCALE,
  },
  buttonDescription: {
    marginTop: 1,
    fontSize: 160 * BUTTON_SCALE,
  },

});