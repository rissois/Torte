import { useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectActiveFilterKeys } from '../../redux/selectors/selectorsFilters';

export function useActiveFilterKeys() {
  return useSelector(selectActiveFilterKeys)
}