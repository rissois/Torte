import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'
import { createShallowEqualSelector } from './selectorCreators'
import { selectNestedFieldFromBill } from './selectorsBills'
import { selectSoldOutItems } from './selectorsItems'

const emptyObject = {}
const emptyArray = []

export const selectOptions = state => state.options

export const selectOption = option_id => createSelector(
    selectOptions,
    options => options[option_id] ?? emptyObject
)

export const selectAlphabeticalOptionIDs = createSelector(
    selectOptions,
    options => Object.keys(options).filter(option_id => options[option_id].is_visible && !options[option_id].is_deleted).sort((a, b) => options[a].name > options[b].name)
)

export const selectOptionIDs = createSelector(
    selectOptions,
    options => Object.keys(options).filter(option_id => options[option_id].is_visible)
)

