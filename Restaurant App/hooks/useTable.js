import React, { useEffect, useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectTable } from '../redux/selectors/selectorsTables';

export default function useTable(table_id) {
  const select = useMemo(() => selectTable, [])
  return useSelector(select(table_id))
}