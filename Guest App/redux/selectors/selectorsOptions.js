import { createSelector } from 'reselect'
import { createShallowEqualSelector } from './selectorCreators'
import { selectActiveFilterKeys } from './selectorsFilters'
import { selectTrackedRestaurantRoot } from './selectorsRestaurant2'

const emptyObject = {}
const emptyArray = []

export const selectOptions = createSelector(
    selectTrackedRestaurantRoot,
    restaurantRoot => restaurantRoot.options ?? emptyObject
)

export const selectOption = (option_id) => createSelector(
    selectOptions,
    options => options[option_id] ?? emptyObject
)

export const selectOptionVariant = (option_id, variant_id) => createSelector(
    selectOption(option_id),
    option => ({ ...option, ...option.variants?.[variant_id] })
)

export const selectIsOptionVariantPassingFilters = (option_id, variant_id) => createSelector(
    selectOptionVariant(option_id, variant_id),
    selectActiveFilterKeys,
    (optionVariant, activeFilterKeys) => optionVariant.is_filter_list_approved && activeFilterKeys.every(key => optionVariant.filters[key] !== false)
)