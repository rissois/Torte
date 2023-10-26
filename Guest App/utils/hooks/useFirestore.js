import { useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectIsPendingBillGroup, selectIsClaimingBillItem } from '../../redux/selectors/selectorsFirestore';

export function useIsPendingBillGroup(bill_group_id) {
  const select = useMemo(() => selectIsPendingBillGroup, [bill_group_id])
  return useSelector(select(bill_group_id))
}

export function useIsClaimingBillItem(bill_item_id) {
  const select = useMemo(() => selectIsClaimingBillItem, [])
  return useSelector(select(bill_item_id))
}