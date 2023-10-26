import React, { useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectNestedFieldFromBill } from '../redux/selectors/selectorsBills';

export default function useBillNestedFields(bill_id, ...fields) {
  const select = useMemo(() => selectNestedFieldFromBill, [])
  return useSelector(select(bill_id, ...fields))
}