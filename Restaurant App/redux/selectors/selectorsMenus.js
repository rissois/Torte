import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'
import { createShallowEqualSelector } from './selectorCreators'
import { selectDietaryFilters } from './selectorsApp'
import { selectNestedFieldFromBill } from './selectorsBills'

const emptyObject = {}
const emptyArray = []

export const selectMenus = state => state.menus

export const selectAlphabeticalMenuIDs = createSelector(
    selectMenus,
    menus => Object.keys(menus).filter(menu_id => menus[menu_id].is_visible && !menus[menu_id].is_deleted).sort((a, b) => menus[a].name > menus[b].name)
)

