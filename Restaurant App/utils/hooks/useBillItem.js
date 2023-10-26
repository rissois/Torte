import React, { useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectBillItem, selectBillItemComment, selectBillItemComped, selectBillItemCustom, selectBillItemFilters, selectCompableBillItemIDs, selectBillItemIsEditable, selectBillItemModifiers, selectBillItemSize, selectBillItemUpsells, selectBillItemsFromBill, selectBillItemIDsReprint, selectBillItemsUserSummaries } from '../../redux/selectors/selectorsBillItems';
import equalArrays from '../functions/equalArrays';


// export function useBillGroup(bill_group_id) {
//   const select = useMemo(() => selectBillGroup, [])
//   return useSelector(select(bill_group_id))
// }
export function useCompableBillItemIDs(bill_id,) {
  const select = useMemo(() => selectCompableBillItemIDs, [])
  return useSelector(select(bill_id))
}

export function useBillItems(bill_id) {
  const select = useMemo(() => selectBillItemsFromBill, [])
  return useSelector(select(bill_id))
}

export function useBillItemsByUser(bill_id) {
  const select = useMemo(() => selectBillItemsUserSummaries, [])
  return useSelector(select(bill_id), (a, b) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(user_id => a[user_id].subtotal === b[user_id].subtotal && a[user_id].items === b[user_id].items))
}

export function useBillItemIDsReprint(bill_id) {
  const select = useMemo(() => selectBillItemIDsReprint, [])
  return useSelector(select(bill_id))
}

export function useBillItem(bill_id, bill_item_id) {
  const select = useMemo(() => selectBillItem, [])
  return useSelector(select(bill_id, bill_item_id))
}

export function useBillItemSize(bill_id, bill_item_id) {
  const select = useMemo(() => selectBillItemSize, [])
  return useSelector(select(bill_id, bill_item_id), (a, b) => a.code === b.code && a.name === b.name && a.price === b.price)
}

export function useBillItemFilters(bill_id, bill_item_id) {
  const select = useMemo(() => selectBillItemFilters, [])
  return useSelector(select(bill_id, bill_item_id), (a, b) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(filterKey => a[filterKey] === b[filterKey]))
}

export function useBillItemModifiers(bill_id, bill_item_id) {
  const select = useMemo(() => selectBillItemModifiers, [])
  return useSelector(select(bill_id, bill_item_id), (a, b) => false)
}

export function useBillItemUpsells(bill_id, bill_item_id) {
  const select = useMemo(() => selectBillItemUpsells, [])
  return useSelector(select(bill_id, bill_item_id), (a, b) => equalArrays(a, b))
}

export function useBillItemCustom(bill_id, bill_item_id) {
  const select = useMemo(() => selectBillItemCustom, [])
  return useSelector(select(bill_id, bill_item_id), (a, b) => equalArrays(a, b))
}

export function useBillItemComped(bill_id, bill_item_id) {
  const select = useMemo(() => selectBillItemComped, [])
  return useSelector(select(bill_id, bill_item_id), (a, b) => a.is_comped !== b.is_comped || a.subtotal !== b.subtotal || a.percent !== b.percent)
}

export function useBillItemComment(bill_id, bill_item_id) {
  const select = useMemo(() => selectBillItemComment, [])
  return useSelector(select(bill_id, bill_item_id))
}

export function useBillItemIsEditable(bill_id, bill_item_id) {
  const select = useMemo(() => selectBillItemIsEditable, [])
  return useSelector(select(bill_id, bill_item_id))
}