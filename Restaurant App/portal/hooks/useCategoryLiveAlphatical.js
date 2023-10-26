import React, { useMemo } from 'react';
import { shallowEqual, useSelector, } from 'react-redux';
import { selectCategoryLiveAlphabetical } from '../../redux/selectors/selectorsCategories';

export default function useCategoryLiveAlphatical(category) {
  const select = useMemo(() => selectCategoryLiveAlphabetical, [])
  return useSelector(select(category), shallowEqual)
}