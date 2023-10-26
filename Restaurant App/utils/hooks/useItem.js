import { useMemo } from 'react';

import { useSelector, } from 'react-redux';
import firebase from 'firebase';
import { selectItem, selectItemNamesWithPrinter, selectItemNamesWithTaxRate } from '../../redux/selectors/selectorsItems';


// export function useBillGroup(bill_group_id) {
//   const select = useMemo(() => selectBillGroup, [])
//   return useSelector(select(bill_group_id))
// }
export function useItem(item_id) {
  const select = useMemo(() => selectItem, [])
  return useSelector(select(item_id))
}

export function useItemNamesWithPrinter(printer_id) {
  const select = useMemo(() => selectItemNamesWithPrinter, [])
  return useSelector(select(printer_id))
}

export function useItemNamesWithTaxRate(tax_rate_id) {
  const select = useMemo(() => selectItemNamesWithTaxRate, [])
  return useSelector(select(tax_rate_id))
}
