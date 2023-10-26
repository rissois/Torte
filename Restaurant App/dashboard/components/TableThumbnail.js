import React, { useMemo } from 'react';
import {
  StyleSheet,

} from 'react-native';
import { shallowEqual, useSelector } from 'react-redux';
import { selectOpenBillsOnTable } from '../../redux/selectors/selectorsTableStatus';
import BillThumbnail from './BillThumbnail';

export default function TableThumbnail({ table_id, setBillID, isHidingEmpty }) {
  // DON"T YOU NEED TO MEMOIZE THIS??!
  const select = useMemo(() => selectOpenBillsOnTable, [])
  const openBills = useSelector(select(table_id), shallowEqual)

  if (!openBills.length) {
    if (isHidingEmpty) return null
    return <BillThumbnail table_id={table_id} />
  }
  return openBills.map(bill_id => <BillThumbnail key={bill_id} bill_id={bill_id} table_id={table_id} setBillID={setBillID} />)
}


const styles = StyleSheet.create({

});

