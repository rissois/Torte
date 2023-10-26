import { useMemo } from 'react';
import { shallowEqual, useSelector, } from 'react-redux';
import { selectBillUserNames, } from '../../redux/selectors/selectorsBill';
import { selectIsBillPaymentComplete } from '../../redux/selectors/selectorsBillUsers';

export function useBillUserNames() {
    return useSelector(selectBillUserNames, shallowEqual)
}

export function useIsBillPaymentComplete(bill_payment_id) {
    const select = useMemo(() => selectIsBillPaymentComplete, [bill_payment_id])
    return useSelector(select(bill_payment_id))
}
