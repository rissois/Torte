import { createSelector } from "reselect"
import { selectTrackedRestaurantRoot } from "./selectorsRestaurant2"

const emptyObject = {}
const emptyArray = []

export const selectSections = createSelector(
    selectTrackedRestaurantRoot,
    restaurantRoot => restaurantRoot.sections ?? emptyObject
)

export const selectSection = (section_id) => createSelector(
    selectTrackedRestaurantRoot,
    restaurantRoot => restaurantRoot[section_id] ?? emptyObject
)

export const selectSectionItemOrder = (section_id) => createSelector(
    selectSection(section_id),
    section => section.item_order ?? emptyArray
)