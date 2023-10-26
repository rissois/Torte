import React, { useCallback, useEffect, } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
} from 'react-native';

import { LargeText, MediumText, DefaultText } from '../../utils/components/NewStyledText';
import Colors from '../../utils/constants/Colors';
import { useSelector } from 'react-redux';
import { selectAvailableCoupons } from '../../redux/selectors/selectorsUserCoupons';
import { pertinentCouponInformation } from '../../utils/functions/coupons';
import { useCoupon } from '../../utils/hooks/useUser';
import centsToDollar from '../../utils/functions/centsToDollar';


export default function PayCoupons({ selectedCoupons, setSelectedCoupons, appliedPerCoupon, setAppliedPerCoupon }) {
  const coupons = useSelector(selectAvailableCoupons)

  useEffect(() => {
    // automatically add coupons
    setSelectedCoupons(coupons.map(coupon => pertinentCouponInformation(coupon)))
  }, [])

  useEffect(() => {
    // Remove any coupons that have expired or been used
    setSelectedCoupons(prev => prev.filter(({ id }) => coupons.some(coupon => coupon.id === id)))
    setAppliedPerCoupon(prev => {
      let copy = { ...prev }
      let isAltered = false
      Object.keys(copy).forEach(id => {
        if (!coupons.some(coupon => coupon.id === id)) {
          isAltered = true
          delete copy[id]
        }
      })
      if (isAltered) return copy
      return prev
    })
  }, [coupons])

  return (
    <View>
      {
        coupons.length ? coupons.map(({ id }) => <Coupon
          key={id}
          coupon_id={id}
          isSelected={selectedCoupons.some(selected => selected.id === id)}
          setSelectedCoupons={setSelectedCoupons}
          applied={appliedPerCoupon[id]}
        />) :
          <MediumText>No discounts available</MediumText>
      }
    </View>
  )
}

// Partially duplicated in LoyaltyScreen, must abstract
const Coupon = ({ isSelected, setSelectedCoupons, coupon_id, applied }) => {
  const coupon = useCoupon(coupon_id)

  const toggleCoupon = useCallback(() => {
    setSelectedCoupons(prev => {
      const index = prev.findIndex(selected => selected.id === coupon_id)
      if (~index) {
        return prev.filter((_, i) => i !== index)
      }
      return [...prev, pertinentCouponInformation(coupon)]
    })
  }, [coupon])

  return (
    <View style={{ borderColor: Colors.white, borderWidth: StyleSheet.hairlineWidth, padding: 12 }}>
      <DefaultText>{coupon.is_torte_issued ? 'Provided by Torte' : 'tbd'}</DefaultText>
      <LargeText bold style={{ color: Colors.green, marginVertical: 6 }}>{coupon.header}</LargeText>
      <TouchableOpacity onPress={toggleCoupon}>
        <View style={[styles.selectedButton, {
          ...isSelected ? { backgroundColor: applied ? Colors.purple : Colors.red, borderColor: applied ? Colors.purple : Colors.red, } : { borderColor: Colors.white, },
        }]}>
          <MediumText bold>{isSelected ? applied ? `Applied (${centsToDollar(applied)})` : 'FAILED' : 'not applied'}</MediumText>
        </View>
      </TouchableOpacity>
    </View>
  )
}




const styles = StyleSheet.create({
  selectedButton: {
    marginTop: 4,
    paddingHorizontal: 12,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    borderWidth: 1,
  }
});