import React from 'react';
import {
  View,
} from 'react-native';
import { LargeText, } from '../../utils/components/NewStyledText';
import centsToDollar from '../../utils/functions/centsToDollar';


export default function SummaryValue({ text, value }) {
  return (
    <View style={{ flexDirection: 'row', paddingVertical: 2 }}>
      <LargeText style={{ flex: 1 }}>{text}</LargeText>
      <LargeText>{centsToDollar(value)}</LargeText>
    </View>
  )
}