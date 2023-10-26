import { createSelector } from "reselect"
import arrayToCommaList from "../../utils/functions/arrayToCommaList"
import centsToDollar from "../../utils/functions/centsToDollar"
import { initialFilters } from "../reducers/reducerFilters"
import { selectSections } from "./selectorSections"
import { selectActiveFilterKeys } from "./selectorsFilters"
import { selectItems } from "./selectorsItems"
import { selectTrackedRestaurantRoot } from "./selectorsRestaurant2"

const emptyObject = {}
const emptyArray = []


export const selectMenus = createSelector(
    selectTrackedRestaurantRoot,
    restaurantRoot => restaurantRoot.menus ?? emptyObject
)

export const selectMenu = (menu_id) => createSelector(
    selectTrackedRestaurantRoot,
    menus => menus[menu_id] ?? emptyObject
)

const selectTrackedMenuID = state => state.trackers.menu_id

export const selectTrackedMenu = createSelector(
    selectMenus,
    selectTrackedMenuID,
    (menus, menu_id) => menus[menu_id] ?? emptyObject
)

export const selectTrackedMenuName = createSelector(
    selectTrackedMenu,
    menu => menu.name || ''
)

export const selectTrackedMenuSectionOrder = createSelector(
    selectTrackedMenu,
    menu => menu.section_order || emptyArray
)

const filterItems = (items = {}, activeFilterKeys) => ({ item_id, variant_id }) => {
    const item = { ...items[item_id], ...items[item_id]?.variants[variant_id] }

    return item.is_visible && (!item.is_filter_list_approved || !activeFilterKeys.some(key => item.filters[key] === false))
}

export const selectMenuSectionList = createSelector(
    selectTrackedMenu,
    selectSections,
    selectItems,
    selectActiveFilterKeys,
    (menu, sections, items, activeFilterKeys) => {
        if (!menu?.section_order) return emptyArray

        return menu.section_order.filter(section_id => sections[section_id]?.is_visible)
            .map(section_id => {
                return {
                    ...sections[section_id],
                    data: sections[section_id].item_order.filter(filterItems(items, activeFilterKeys))
                }
            })
    }
)
