import { createSelector } from "reselect"
import { selectTrackedRestaurant, selectTrackedRestaurantRoot } from "./selectorsRestaurant2"

const emptyObject = {}
const emptyArray = []


export const selectMeals = createSelector(
    selectTrackedRestaurant,
    restaurant => restaurant.meals ?? emptyObject
)

export const selectTrackedMealID = state => state.trackers.meal_id

export const selectTrackedMealName = createSelector(
    selectMeals,
    selectTrackedMealID,
    (meals, meal_id) => meals[meal_id]?.name ?? ''
)
