import React, { useEffect, useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectNestedFieldFromPrivateDoc } from '../redux/selectors/selectorsPrivateDocument';

export default function usePrivateNestedField(id, ...fields) {
  const select = useMemo(() => selectNestedFieldFromPrivateDoc, [])
  return useSelector(select(id, ...fields))
}