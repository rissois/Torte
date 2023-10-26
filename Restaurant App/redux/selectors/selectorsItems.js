import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'
import { createShallowEqualSelector } from './selectorCreators'
import { selectDietaryFilters } from './selectorsApp'
import { selectNestedFieldFromBill } from './selectorsBills'

const emptyObject = {}
const emptyArray = []

export const selectItems = state => state.items

export const selectItem = item_id => createSelector(
    selectItems,
    items => items[item_id] ?? emptyObject
)

export const selectAlphabeticalItemIDs = createSelector(
    selectItems,
    items => Object.keys(items).filter(item_id => items[item_id].is_visible && !items[item_id].is_deleted).sort((a, b) => items[a].name > items[b].name)
)

export const selectItemIDs = createSelector(
    selectItems,
    items => Object.keys(items).filter(item_id => items[item_id].is_visible)
)

export const selectItemsPassingFilters = createSelector(
    selectItems,
    selectDietaryFilters,
    (items, dietaryFilters) => {
        return Object.keys(items).filter(item_id => items[item_id].is_visible && !items[item_id].is_deleted && (!dietaryFilters.length || (items[item_id].is_filter_list_approved && dietaryFilters.every(filterKey => items[item_id].filters[filterKey] !== false)))).sort((a, b) => items[a].name > items[b].name)
    }
)

export const selectAlphaveticalItemVariants = createSelector(
    selectItems,
    items => {
        return Object.keys(items).filter(id => !items[id].items).sort((a, b) => items[a].name > items[b].name).flatMap(item_id => {
            return [{ item_id, variant_id: '' }, ...Object.keys(items[item_id].variants).map(variant_id => ({ item_id, variant_id }))]
        })
    }
)

export const selectItemNamesWithPrinter = (printer_id) => createSelector(
    selectItems,
    items => Object.keys(items).reduce((acc, item_id) => {
        const item = items[item_id]
        if (!item.is_deleted && item.printer_id === printer_id) return [...acc, item.name]
        return acc
    }, [])
)

export const selectItemNamesWithTaxRate = (tax_rate_id) => createSelector(
    selectItems,
    items => Object.keys(items).reduce((acc, item_id) => {
        const item = items[item_id]
        if (!item.is_deleted && item.tax_rate_id === tax_rate_id) return [...acc, item.name]
        return acc
    }, [])
)
