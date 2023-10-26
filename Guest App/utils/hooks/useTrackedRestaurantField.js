import { useMemo } from 'react';
import { selectNestedFieldFromTrackedRestaurant } from '../../redux/selectors/selectorsRestaurant';
import { useSelector, } from 'react-redux';

export default function useTrackedRestaurantField(...fields) {
  const select = useMemo(() => selectNestedFieldFromTrackedRestaurant, [])
  return useSelector(select(...fields))
}


