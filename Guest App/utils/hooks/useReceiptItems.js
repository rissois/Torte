import { useMemo } from 'react';
import { shallowEqual, useSelector, } from 'react-redux';
import { selectReceiptItem, selectReceiptItemSplitDetails, } from '../../redux/selectors/selectorsReceiptItems';

export function useReceiptItem(receipt_item_id) {
    const select = useMemo(() => selectReceiptItem, [])
    return useSelector(select(receipt_item_id))
}

export function useReceiptItemSplitDetails(receipt_item_id) {
    const select = useMemo(() => selectReceiptItemSplitDetails, [])
    return useSelector(select(receipt_item_id), shallowEqual)
}



