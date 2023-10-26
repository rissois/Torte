import React, { useState, useEffect, } from 'react';
import {
  StyleSheet,
  View,
  TouchableWithoutFeedback,
  TouchableOpacity,

} from 'react-native';

import { useDispatch, } from 'react-redux';

import Colors from '../../utils/constants/Colors';
import Layout from '../../utils/constants/Layout';
import { SerifText, DefaultText, MediumText, } from '../../utils/components/NewStyledText';
import months from '../../utils/constants/months';
import { doBillCategorySet, } from '../../redux/actions/actionsBill';
import { useNavigation, } from '@react-navigation/native';

export default function LedgerModal({ selected, clearModal, }) {
  const dispatch = useDispatch()
  const navigation = useNavigation()

  const {
    id,
    restaurant: { name: restaurant_name, id: restaurant_id } = {},
    timestamps: { closed, created } = {},
    order_summary: { subtotal } = {},
  } = selected || {}

  const [fullDate, setFullDate] = useState('')


  useEffect(() => {
    let date = created?.toDate()
    if (date) {
      setFullDate(months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear())
    }
  }, [created])


  return (
    <View style={{ justifyContent: 'flex-end', flex: 1, backgroundColor: Colors.black + 'EA' }}>

      <TouchableWithoutFeedback onPress={() => {
        clearModal()
      }}>
        <View style={{ flex: 5 }} />
      </TouchableWithoutFeedback>


      <TouchableWithoutFeedback onPress={() => {
        clearModal()
      }}>
        <View style={styles.billTitle}>
          <SerifText maxFontSizeMultiplier={1.5} >{restaurant_name || 'Scanned receipt'}</SerifText>
          <DefaultText maxFontSizeMultiplier={1.5} >{fullDate}</DefaultText>
        </View>
      </TouchableWithoutFeedback>


      <View>
        {
          !closed &&
          <Option
            onPress={() => restaurant_id ? navigation.navigate('Link', { restaurant_id, bill_id: id }) : navigation.navigate('Link', { receipt_id: id })}
            text={restaurant_id ? 'Return to bill' : 'Open receipt'}
          />
        }
        {
          !!subtotal && <Option
            onPress={() => {
              dispatch(doBillCategorySet('bill', selected))
              // QUERY AND SET ITEMS
              // ... probably better to navigate, return as loading, and then query
              navigation.navigate('Bill', { isReceipt: true })
            }}
            text='Receipts'
          />
        }
        {
          !!closed && !subtotal && <Option
            disabled
            text='Bill was closed without orders'
          />
        }
      </View>

      <TouchableWithoutFeedback onPress={() => {
        clearModal()
      }}>
        <View style={{ flex: 3 }} />
      </TouchableWithoutFeedback>
    </View>)
}

const Option = ({ onPress, text, disabled }) => (
  <TouchableOpacity disabled={disabled} style={[styles.buttonContainer, { backgroundColor: disabled ? undefined : Colors.darkgrey }]} onPress={onPress}>
    <MediumText style={styles.modalButtonText}>{text}</MediumText>
  </TouchableOpacity>
)



const styles = StyleSheet.create({
  billTitle: {
    alignSelf: 'center',
    marginBottom: 24,
    width: Layout.window.width * 0.85,
  },
  buttonContainer: {
    width: Layout.window.width * 0.85,
    padding: 16,
    alignSelf: 'center',
    borderRadius: 15,
    marginBottom: 15,
  },
  modalButtonText: {
    fontSize: 20,
    color: Colors.white,
  },
});

