import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import Colors from '../constants/Colors';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doDeleteChildReset } from '../../redux/actions/actionsDelete';
import IndicatorOverlay from './IndicatorOverlay';



export default function DeleteAlert(props) {
  const dispatch = useDispatch()
  const name = useSelector(state => state.deleteAlert)

  if (!name) return null
  // TURN OFF SHOW, then read in the new
  return <View style={[StyleSheet.absoluteFill, styles.box]}>
    <TouchableOpacity onPress={() => {
      dispatch(doDeleteChildReset())
    }}>
      <MaterialCommunityIcons
        name='close-circle'
        size={30}
        color={Colors.white}
      />
    </TouchableOpacity>
    <View style={{ flex: 1 }}>
      <IndicatorOverlay text={`Deleting ${name}...`} opacity='00' />
    </View>
  </View>
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: Colors.black + 'DA',
    paddingVertical: 40,
    paddingHorizontal: 30,
  }
})