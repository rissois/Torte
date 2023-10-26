import { createSelector } from 'reselect'
import { createShallowEqualSelector } from './selectorCreators'
import { selectBillGroups } from './selectorsBillGroups'
import { selectActiveFilterKeys } from './selectorsFilters'
import { selectTrackedRestaurantRoot } from './selectorsRestaurant2'
import { selectMyID } from './selectorsUser'

const emptyObject = {}
const emptyArray = []

export const selectItems = createSelector(
    selectTrackedRestaurantRoot,
    restaurantRoot => restaurantRoot.items ?? emptyObject
)

export const selectItem = (item_id) => createSelector(
    selectItems,
    items => items[item_id] ?? emptyObject
)

export const selectItemVariant = (item_id, variant_id) => createSelector(
    selectItem(item_id),
    item => ({ ...item, ...item.variants?.[variant_id] })
)

export const selectItemOption = (item_id, variant_id) => createSelector(
    selectItem(item_id),
    item => ({ ...item, ...item.options?.[variant_id] })
)

export const selectIsItemOptionPassingFilters = (item_id, variant_id) => createSelector(
    selectItemOption(item_id, variant_id),
    selectActiveFilterKeys,
    (itemOption, activeFilterKeys) => itemOption.is_filter_list_approved && activeFilterKeys.every(key => itemOption.filters[key] !== false)
)

export const selectIsItemVariantPassingFilters = (item_id, variant_id) => createSelector(
    selectItemVariant(item_id, variant_id),
    selectActiveFilterKeys,
    (itemVariant, activeFilterKeys) => !activeFilterKeys.length || (itemVariant.is_filter_list_approved && activeFilterKeys.every(key => itemVariant.filters[key] !== false))
)


const selectTrackedItemID = state => state.trackers.item_id
const selectTrackedVariantID = state => state.trackers.variant_id

export const selectIsSoldOutVariant = (item_id, variant_id) => createSelector(
    selectItem(item_id),
    item => variant_id ? item.variants[variant_id].is_sold_out : item.is_sold_out
)


/*
----- TRACKED -----
*/

export const selectTrackedItem = createSelector(
    selectItems,
    selectTrackedItemID,
    selectTrackedVariantID,
    (items, item_id, variant_id) => ({ ...items[item_id], ...items[item_id]?.variants?.[variant_id] })
)

export const selectTrackedItemPhotoID = createSelector(
    selectTrackedItem,
    item => item.photo?.id
)


export const selectTrackedItemModiferIDs = createSelector(
    selectTrackedItem,
    item => item.modifier_ids || emptyArray
)