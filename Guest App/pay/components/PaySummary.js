import React from 'react';
import {
  StyleSheet,
  View,
} from 'react-native';
import { LargeText, } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import SummaryValue from '../../bill/components/SummaryValue';



export default function PaySummary({ subtotal, discounts, tax, tip, final, isTipFree }) {
  return (
    <View>
      <SummaryValue text='Subtotal' value={subtotal} />
      <SummaryValue text='Tax' value={tax} />
      {!isTipFree && <SummaryValue text='Tip' value={tip} />}
      <SummaryValue text='Discounts' value={-discounts} />
      <View style={{ borderTopColor: Colors.white, borderTopWidth: 1, paddingTop: 4, marginTop: 4 }}>
        <SummaryValue text='Total' value={final} />
      </View>
    </View>
  )
}


const styles = StyleSheet.create({

});