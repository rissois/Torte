import React, { useMemo, useEffect, useState } from 'react';
import { useSelector, } from 'react-redux';
import { selectIsMyAccountAdmin, selectIsMyAccountAnonymous, selectIsMyAccountInitialized, selectMyID, selectMyName } from '../../redux/selectors/selectorsUser';
import { doc, getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { selectCoupon } from '../../redux/selectors/selectorsUserCoupons';
import firebaseApp from '../../firebase/firebase';

const firestore = getFirestore(firebaseApp)
const auth = getAuth(firebaseApp)

export function useIsMyAccountAdmin() {
  return useSelector(selectIsMyAccountAdmin)
}

export function useMyID() {
  return useSelector(selectMyID)
}

export function useMyRef() {
  const my_id = useSelector(selectMyID)
  return my_id ? doc(firestore, 'UsersPOS', my_id) : null
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

export function useIsMyAccountAnonymous() {
  return useSelector(selectIsMyAccountAnonymous)
}


