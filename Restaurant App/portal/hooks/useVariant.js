import React, { useMemo } from 'react';
import { shallowEqual, useSelector, } from 'react-redux';
import useCategoryChild from './useCategoryChild';

export default function useVariant(category, id, variant_id) {
  const document = useCategoryChild(category, id)
  return ({ ...document, ...document.variants[variant_id] })
}