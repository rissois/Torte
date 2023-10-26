import { useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectModifier } from '../../redux/selectors/selectorsModifiers';

export function useModifier(modifier_id) {
  const select = useMemo(() => selectModifier, [])
  return useSelector(select(modifier_id))
}


