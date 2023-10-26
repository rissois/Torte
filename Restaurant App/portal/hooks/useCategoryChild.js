import React, { useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectCategoryChild, } from '../../redux/selectors/selectorsCategories';

export default function useCategoryChild(category, id, variant_id) {
  const select = useMemo(() => selectCategoryChild, [])
  return useSelector(select(category, id, variant_id))
}