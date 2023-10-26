import React, { useEffect, useMemo } from 'react';
import { shallowEqual, useSelector, } from 'react-redux';
import { selectLineItemIDsOnBill, selectLineItemUserSummary, selectLineItemNameOnBill, selectLineItemOnBill, selectLineItemsOnOrder, selectLineItemFirstBillItemID, selectLineItemBillItemIDs, selectLineItemQuantity, selectLineItemCaptions, selectLineItemSubtotal, selectLineItemItemID, selectLineItemVariantID, selectLineItem, selectLineItemField, selectLineItemIDsOnBillByPrintStatus, selectLineItemNestedField } from '../redux/selectors/selectorsLineItems4';
import equalArrays from '../utils/functions/equalArrays';

export function useLineItem(bill_id, lineItemID, isOrder) {
  const select = useMemo(() => selectLineItem, [])
  return useSelector(select(bill_id, lineItemID, isOrder))
}

export function useLineItemField(bill_id, lineItemID, field, isOrder) {
  const select = useMemo(() => selectLineItemField, [])
  return useSelector(select(bill_id, lineItemID, field, isOrder), shallowEqual)
}

export function useLineItemNestedField(bill_id, lineItemID, isOrder, ...fields) {
  const select = useMemo(() => selectLineItemNestedField, [])
  return useSelector(select(bill_id, lineItemID, isOrder, ...fields))
}

export function useLineItemIDsOnBill(bill_id) {
  const select = useMemo(() => selectLineItemIDsOnBill, [])
  return useSelector(select(bill_id), shallowEqual)
}

export function useLineItemIDsOnBillByPrintStatus(bill_id, isPrinted) {
  const select = useMemo(() => selectLineItemIDsOnBillByPrintStatus, [])
  return useSelector(select(bill_id, isPrinted), shallowEqual)
}

export function useLineItemOnBill(bill_id, lineItemID) {
  const select = useMemo(() => selectLineItemOnBill, [])
  return useSelector(select(bill_id, lineItemID), shallowEqual)
}

export function useLineItemQuantity(bill_id, lineItemID) {
  const select = useMemo(() => selectLineItemQuantity, [])
  return useSelector(select(bill_id, lineItemID))
}

export function useLineItemCaptions(bill_id, lineItemID) {
  const select = useMemo(() => selectLineItemCaptions, [])
  return useSelector(select(bill_id, lineItemID), shallowEqual)
}

export function useLineItemNameOnBill(bill_id, lineItemID) {
  const select = useMemo(() => selectLineItemNameOnBill, [])
  return useSelector(select(bill_id, lineItemID))
}

export function useLineItemItemID(bill_id, lineItemID) {
  const select = useMemo(() => selectLineItemItemID, [])
  return useSelector(select(bill_id, lineItemID))
}

export function useLineItemVariantID(bill_id, lineItemID) {
  const select = useMemo(() => selectLineItemVariantID, [])
  return useSelector(select(bill_id, lineItemID))
}

export function useLineItemSubtotal(bill_id, lineItemID) {
  const select = useMemo(() => selectLineItemSubtotal, [])
  return useSelector(select(bill_id, lineItemID))
}

export function useLineItemUserSummary(bill_id, lineItemID, isOrder) {
  const select = useMemo(() => selectLineItemUserSummary, [])
  return useSelector(select(bill_id, lineItemID, isOrder))
}

export function useLineItemBillItemIDs(bill_id, lineItemID) {
  const select = useMemo(() => selectLineItemBillItemIDs, [])
  return useSelector(select(bill_id, lineItemID), (a, b) => equalArrays(a, b))
}

export function useLineItemFirstBillItemID(bill_id, lineItemID) {
  const select = useMemo(() => selectLineItemFirstBillItemID, [])
  return useSelector(select(bill_id, lineItemID))
}

export function useLineItemsonOrder(bill_id) {
  const select = useMemo(() => selectLineItemsOnOrder, [])
  return useSelector(select(bill_id), shallowEqual)
}

