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


export const selectPanels = createSelector(
    selectTrackedRestaurantRoot,
    restaurantRoot => restaurantRoot.panels ?? emptyObject
)

export const selectPanel = (panel_id) => createSelector(
    selectPanels,
    panels => panels[panel_id] ?? emptyObject
)