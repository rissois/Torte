import { useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectReceiptGroup } from '../../redux/selectors/selectorsReceiptGroups';

export function useReceiptGroup(receipt_group_id) {
    const select = useMemo(() => selectReceiptGroup, [])
    return useSelector(select(receipt_group_id))
}




