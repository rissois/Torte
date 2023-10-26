import { createSelector } from "reselect"

const emptyObject = {}

// most others are found with their respective files
export const selectTrackedDotwID = state => state.trackers.dotw_id
export const selectTrackedPeriodID = state => state.trackers.period_id
export const selectTrackedMealID = state => state.trackers.meal_id
export const selectTrackedMenuID = state => state.trackers.menu_id

export const selectIsMissingMenu = createSelector(
    selectTrackedMealID,
    selectTrackedMenuID,
    (meal_id, menu_id) => !meal_id || !menu_id
)