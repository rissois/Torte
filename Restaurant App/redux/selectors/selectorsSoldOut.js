import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'
import { createShallowEqualSelector } from './selectorCreators'
import { selectNestedFieldFromBill } from './selectorsBills'
import { selectAlphabeticalItemIDs, selectItems } from './selectorsItems'
import { selectAlphabeticalOptionIDs, selectOptions } from './selectorsOptions'

const emptyObject = {}
const emptyArray = []

export const selectSoldOutItems = createSelector(
    selectAlphabeticalItemIDs,
    selectItems,
    (item_ids, items) => item_ids.filter(item_id => items[item_id].is_sold_out || Object.values(items[item_id].variants).some(variant => variant.is_sold_out))
)

export const selectNumberSoldOutItems = createShallowEqualSelector(
    selectSoldOutItems,
    soldOutItems => soldOutItems.length
)

export const selectSoldOutOptions = createSelector(
    selectAlphabeticalOptionIDs,
    selectOptions,
    (option_ids, options) => option_ids.filter(option_id => options[option_id].is_sold_out || Object.values(options[option_id].variants).some(variant => variant.is_sold_out))
)

export const selectNumberSoldOutOptions = createShallowEqualSelector(
    selectSoldOutOptions,
    soldOutOptions => soldOutOptions.length
)