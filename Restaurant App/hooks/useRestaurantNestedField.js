import React, { useEffect, useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectNestedFieldFromRestaurant } from '../redux/selectors/selectorsRestaurant';

export default function useRestaurantNestedFields(...fields) {
  const select = useMemo(() => selectNestedFieldFromRestaurant, [])
  return useSelector(select(...fields))
}