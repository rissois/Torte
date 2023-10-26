import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { LargeText, MediumText, SuperLargeText } from '../../utils/components/NewStyledText';
import useTable from '../../hooks/useTable';
import { useBillCode, useBillIsWithOrder, useBillIsPaid, useBillStatus, useBillIsCheckingOut, useBillIsPartiallyPaid } from '../../utils/hooks/useBill';
import { Audio } from 'expo-av';

const newOrderSound = require('../../assets/Paying.wav')
const paymentCompleteSound = require('../../assets/Finished.wav')

export default function BillThumbnail({ bill_id, table_id, setBillID }) {
  // DON"T YOU NEED TO MEMOIZE THIS??!
  const table = useTable(table_id)
  const billCode = useBillCode(bill_id)
  const billStatus = useBillStatus(bill_id)
  const isOrderWaiting = useBillIsWithOrder(bill_id)
  const isPaid = useBillIsPaid(bill_id)
  const isPartiallyPaid = useBillIsPartiallyPaid(bill_id)
  const isCheckoutOut = useBillIsCheckingOut(bill_id)

  const [currentIsOrderWaiting, setCurrentIsOrderWaiting] = useState(false)
  // const [currentIsCheckingOut, setCurrentIsCheckingOut] = useState(false)
  const [currentIsPaid, setCurrentIsPaid] = useState(false)

  const noBill = !bill_id

  useEffect(() => {
    const playNewOrderSound = async (file) => {
      const { sound } = await Audio.Sound.createAsync(file);
      await sound.playAsync();
    }

    if (!currentIsOrderWaiting && isOrderWaiting) playNewOrderSound(newOrderSound)
    if (!currentIsPaid && isPaid) playNewOrderSound(paymentCompleteSound)
    setCurrentIsOrderWaiting(isOrderWaiting)
    // setCurrentIsCheckingOut(isCheckoutOut)
    setCurrentIsPaid(isPaid)
  }, [isOrderWaiting, isPaid, currentIsOrderWaiting, currentIsPaid,])

  return <TouchableOpacity disabled={!bill_id} onPress={() => setBillID(bill_id)}>
    <View style={{ flexDirection: 'row', borderBottomColor: Colors.lightgrey, borderBottomWidth: 1, }}>
      <View style={{ width: 12 }}>
        {isOrderWaiting && <View style={{ backgroundColor: Colors.red, flex: 1 }} />}
        {(isPaid || isPartiallyPaid || isCheckoutOut) && <View style={{ backgroundColor: isPaid ? Colors.green : Colors.yellow, flex: 1 }} />}
      </View>
      <View style={{ flexDirection: 'row', padding: 12, }}>
        <View style={{ justifyContent: 'center' }}>
          <SuperLargeText bold style={{ color: noBill ? Colors.lightgrey : Colors.white }}>{table.code}</SuperLargeText>
        </View>
        <View style={{ marginLeft: 18, }}>
          <LargeText bold style={{ color: noBill ? Colors.lightgrey : Colors.white }}>{table.name}  {billCode ? `#${billCode}` : ''}</LargeText>
          {
            bill_id
              ? <MediumText >{billStatus}</MediumText>
              : <MediumText style={{ color: noBill ? Colors.lightgrey : Colors.white }}>No bill</MediumText>
          }
        </View>
      </View>
    </View>
  </TouchableOpacity>
}

const styles = StyleSheet.create({

});

