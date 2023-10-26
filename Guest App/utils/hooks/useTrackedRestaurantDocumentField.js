import { useMemo } from 'react';
import { selectNestedFieldFromTrackedRestaurantCollection } from '../../redux/selectors/selectorsRestaurant';
import { useSelector, } from 'react-redux';

export default function useTrackedRestaurantDocumentField(collection, id, ...fields) {
  const select = useMemo(() => selectNestedFieldFromTrackedRestaurantCollection, [])
  return useSelector(select(collection, id, ...fields))
}


