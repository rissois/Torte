import { useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectCarts, selectBillGroup } from '../../redux/selectors/selectorsBillGroups';

export function useBillGroup(bill_group_id) {
    const select = useMemo(() => selectBillGroup, [])
    return useSelector(select(bill_group_id))
}

export function useBillCarts(isOnlyOrdered) {
    const select = useMemo(() => selectCarts, [])
    return useSelector(select(isOnlyOrdered))
}


