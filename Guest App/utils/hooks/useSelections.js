import { useMemo, } from 'react';
import { useSelector, } from 'react-redux';
import { selectIsFilterSelected, selectModifierSelectedQuantity, selectModSelectedQuantity, selectUpsellSelectedQuantity } from '../../redux/selectors/selectorsSelections';

export function useIsFilterSelected(filterKey) {
    const select = useMemo(() => selectIsFilterSelected, [])
    return useSelector(select(filterKey))
}

export function useUpsellSelectedQuantity({ item_id, option_id, variant_id }) {
    const select = useMemo(() => selectUpsellSelectedQuantity, [])
    return useSelector(select({ item_id, option_id, variant_id }))
}

export function useModifierSelectedQuantity(modifier_id) {
    const select = useMemo(() => selectModifierSelectedQuantity, [])
    return useSelector(select(modifier_id))
}

export function useModSelectedQuantity(modifier_id, { item_id, option_id, variant_id }) {
    const select = useMemo(() => selectModSelectedQuantity, [])
    return useSelector(select(modifier_id, { item_id, option_id, variant_id }))
}


