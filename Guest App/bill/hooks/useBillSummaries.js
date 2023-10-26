
import { useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectBillSummaries } from '../redux-selectors/selectBillSummary';

// [isBillUnpaid, isBillStarted]

export default function useBillSummaries(is_receipt) {
  const select = useMemo(() => selectBillSummaries, [])
  return useSelector(select(is_receipt))
}