import { createSelector } from "reselect"
import { selectTrackedRestaurant } from "./selectorsRestaurant2"

const emptyObject = {}

const selectListeners = state => state.listeners

export const selectIsListeningUser = createSelector(
    selectListeners,
    listeners => !!listeners.user.user
)

const selectIsListeningRestaurant = createSelector(
    selectListeners,
    listeners => !!listeners.restaurant.restaurant
)

export const selectIsListeningMenus = createSelector(
    selectListeners,
    listeners => !!listeners.restaurant.menus ?? emptyObject
)

export const selectIsRestaurantLoading = createSelector(
    selectIsListeningRestaurant,
    selectIsListeningMenus,
    selectTrackedRestaurant,
    (isRestaurant, isMenus, restaurant) => !isRestaurant || !isMenus || !restaurant.id
)