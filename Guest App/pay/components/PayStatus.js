import React from 'react';
import {
  View,
  Platform,
} from 'react-native';
import { MaterialIcons, } from '@expo/vector-icons';
import { LargeText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import { useSelector } from 'react-redux';

import { selectPayStatus } from '../../redux/selectors/selectorsBillItems';
import { selectIsUserAlreadyOrdered } from '../../redux/selectors/selectorsBill';


export default function PayStatus() {
  const [isPayingBillRemainder, isPayingMyRemainder, isPayingServerRemainder, isBillWithServerItems] = useSelector(selectPayStatus)
  const isUserAlreadyOrdered = useSelector(selectIsUserAlreadyOrdered)

  return <View>
    <LargeText center bold style={{ marginBottom: 10 }}>Will this payment complete:</LargeText>
    <View style={{ alignSelf: 'center' }}>
      <PaymentStatus text='The bill?' isComplete={isPayingBillRemainder} />
      {isUserAlreadyOrdered && <PaymentStatus text='My items?' isComplete={isPayingMyRemainder} />}
      {Platform.OS !== 'web' && !!isBillWithServerItems && <PaymentStatus text='Server items?' isComplete={isPayingServerRemainder} />}
    </View>
  </View>
}

const PaymentStatus = ({ text, isComplete }) => (<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 5, }}>
  <LargeText style={{ marginRight: 20 }}>{text}</LargeText>
  <MaterialIcons
    name={isComplete ? 'check-circle' : 'clear'}
    size={24}
    color={isComplete ? Colors.green : Colors.red}
  />
</View>)