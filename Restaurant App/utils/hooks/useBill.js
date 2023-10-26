import { useMemo } from 'react';

import { shallowEqual, useSelector, } from 'react-redux';
import firebase from 'firebase';
import { selectBill, selectBillCode, selectBillIsCheckingOut, selectBillIsOrderAlert, selectBillIsPaid, selectBillIsPartiallyPaid, selectBillIsWithItems, selectBillIsWithOrder, selectBillStatus, selectBillUserIDs, selectBillUserName, selectBillUserStatuses } from '../../redux/selectors/selectorsBills';
import { selectBillUserClaimSummaries } from '../../redux/selectors/selectorsBillItems';

// export function useBillGroup(bill_group_id) {
//   const select = useMemo(() => selectBillGroup, [])
//   return useSelector(select(bill_group_id))
// }
export function useBill(bill_id) {
  const select = useMemo(() => selectBill, [])
  return useSelector(select(bill_id))
}

export function useBillCode(bill_id) {
  const select = useMemo(() => selectBillCode, [])
  return useSelector(select(bill_id))
}

export function useBillStatus(bill_id) {
  const select = useMemo(() => selectBillStatus, [])
  return useSelector(select(bill_id))
}

export function useBillIsWithItems(bill_id) {
  const select = useMemo(() => selectBillIsWithItems, [])
  return useSelector(select(bill_id))
}

export function useBillIsWithOrder(bill_id) {
  const select = useMemo(() => selectBillIsWithOrder, [])
  return useSelector(select(bill_id))
}

export function useBillIsPaid(bill_id) {
  const select = useMemo(() => selectBillIsPaid, [])
  return useSelector(select(bill_id))
}
export function useBillIsPartiallyPaid(bill_id) {
  const select = useMemo(() => selectBillIsPartiallyPaid, [])
  return useSelector(select(bill_id))
}
export function useBillIsCheckingOut(bill_id) {
  const select = useMemo(() => selectBillIsCheckingOut, [])
  return useSelector(select(bill_id))
}

export function useBillUserIDs(bill_id) {
  const select = useMemo(() => selectBillUserIDs, [])
  return useSelector(select(bill_id), shallowEqual)
}

export function useBillUserStatuses(bill_id) {
  const select = useMemo(() => selectBillUserStatuses, [])
  return useSelector(select(bill_id), shallowEqual)
}

export function useBillUserName(bill_id, user_id) {
  const select = useMemo(() => selectBillUserName, [])
  return useSelector(select(bill_id, user_id))
}

export function useBillUserClaimSummaries(bill_id) {
  const select = useMemo(() => selectBillUserClaimSummaries, [])
  return useSelector(select(bill_id), (a, b) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(user_id => a[user_id] === b[user_id]))
}