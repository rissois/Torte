import { useMemo } from 'react';
import { shallowEqual, useSelector, } from 'react-redux';
import { selectBillItem, selectBillItemSplitDetails, } from '../../redux/selectors/selectorsBillItems';

export function useBillItem(bill_item_id) {
    const select = useMemo(() => selectBillItem, [])
    return useSelector(select(bill_item_id))
}

export function useBillItemSplitDetails(bill_item_id) {
    const select = useMemo(() => selectBillItemSplitDetails, [])
    return useSelector(select(bill_item_id), shallowEqual)
}



