import { useMemo } from 'react';
import { useSelector, } from 'react-redux';
import { selectIsItemVariantPassingFilters, selectItemOption, } from '../../redux/selectors/selectorsItems';
import { selectIsOptionVariantPassingFilters, selectOptionVariant } from '../../redux/selectors/selectorsOptions';

export function useOptionVariant(option_id, variant_id) {
    const select = useMemo(() => selectOptionVariant, [])
    return useSelector(select(option_id, variant_id))
}

export function useOptionOrItemOption({ item_id, option_id, variant_id }) {
    const select = useMemo(() => item_id ? selectItemOption : selectOptionVariant, [item_id,])
    return useSelector(select(item_id || option_id, variant_id))
}

export function useIsOptionOrItemOptionPassingFilters({ item_id, option_id, variant_id }) {
    const select = useMemo(() => item_id ? selectIsItemVariantPassingFilters : selectIsOptionVariantPassingFilters, [item_id,])
    return useSelector(select(item_id || option_id, variant_id))
}


