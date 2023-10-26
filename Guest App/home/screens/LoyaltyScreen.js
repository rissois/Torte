import React, { } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
} from 'react-native';
import Colors from '../../utils/constants/Colors';
import { useSelector } from 'react-redux';
import centsToDollar from '../../utils/functions/centsToDollar';
import { DefaultText, LargeText, MediumText, SuperLargeText } from '../../utils/components/NewStyledText';
import SafeView from '../../utils/components/SafeView';
import Header from '../../utils/components/Header';
import Layout from '../../utils/constants/Layout';


export default function LoyaltyScreen({ navigation, route }) {
  const spend = useSelector(state => state.user.spend?.torte?.spend ?? 0)
  const coupons = useSelector(state => state.user.coupons)

  return <SafeView noBottom>
    <Header back>
      <LargeText center>Loyalty</LargeText>
    </Header>

    <ScrollView style={{ flex: 1, marginHorizontal: Layout.marHor }} contentContainerStyle={{ paddingVertical: 50 }}>
      <MediumText center bold>We are working to build a loyalty platform that rewards your visits.</MediumText>
      <MediumText center style={{ marginTop: 10 }}>In the meantime, we will save all your loyalty!</MediumText>

      <View style={{ marginVertical: 50 }}>
        <LargeText center >CURRENT SPEND</LargeText>
        <SuperLargeText center style={{ marginTop: 10 }}>{centsToDollar(spend)}</SuperLargeText>
      </View>


      {
        Object.keys(coupons).map(coupon_id => <Coupon key={coupon_id} {...coupons[coupon_id]} />)
      }

    </ScrollView>

  </SafeView>
}

// Partially duplicated in PayCoupons, must abstract
const Coupon = ({ header, is_torte_issued, text, timestamps: { expiration, used } }) => (
  <View style={{ borderColor: Colors.white, borderWidth: StyleSheet.hairlineWidth, padding: 12, marginBottom: 16 }}>
    <DefaultText>{is_torte_issued ? 'Provided by Torte' : 'tbd'}</DefaultText>
    <LargeText bold style={{ color: Colors.green, marginVertical: 6 }}>{header}</LargeText>
    {
      text.map(t => <DefaultText key={t} style={{ marginTop: 2 }}>{t}</DefaultText>)
    }

    <DefaultText style={{ marginTop: 20, ...!!used && { color: Colors.red, fontWeight: 'bold' } }}>{used ? 'CLAIMED' : expiration ? 'tbd' : 'This offer does not expire'}</DefaultText>
  </View>
)



const styles = StyleSheet.create({

});