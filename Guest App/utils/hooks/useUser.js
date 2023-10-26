import React, { useMemo, useEffect, useState } from 'react';
import { useSelector, } from 'react-redux';
import { selectIsMyAccountAdmin, selectIsMyAccountInitialized, selectMyID, selectMyName } from '../../redux/selectors/selectorsUser';
import firestore from '@react-native-firebase/firestore'
import { selectCoupon } from '../../redux/selectors/selectorsUserCoupons';

export function useIsMyAccountAdmin() {
  return useSelector(selectIsMyAccountAdmin)
}

export function useMyID() {
  return useSelector(selectMyID)
}

export function useMyRef() {
  const my_id = useSelector(selectMyID)
  return firestore().collection('UsersPOS').doc(my_id)
}

export function useMyName() {
  return useSelector(selectMyName)
}

export function useCoupon(coupon_id) {
  const select = useMemo(() => selectCoupon, [])
  return useSelector(select(coupon_id))
}

export function useIsMyAccountInitialized() {
  return useSelector(selectIsMyAccountInitialized)
}


