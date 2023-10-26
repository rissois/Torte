import { useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectIsItemVariantPassingFilters, selectIsSoldOutVariant, selectItemVariant } from '../../redux/selectors/selectorsItems';

export function useItemVariant(item_id, variant_id) {
    const select = useMemo(() => selectItemVariant, [])
    return useSelector(select(item_id, variant_id))
}

export function useIsItemVariantPassingFilters(item_id, variant_id) {
    const select = useMemo(() => selectIsItemVariantPassingFilters, [])
    return useSelector(select(item_id, variant_id))
}

export function useIsSoldOutVariant(item_id, variant_id) {
    const select = useMemo(() => selectIsSoldOutVariant, [])
    return useSelector(select(item_id, variant_id))
}


