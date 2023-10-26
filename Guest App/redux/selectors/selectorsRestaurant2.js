import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'
import { selectIsStripeTestMode } from './selectorsApp'
import { selectTrackedMealID } from './selectorsTrackers'

const emptyObject = {}

const selectRestaurants = state => state.restaurants || emptyObject
export const selectTrackedRestaurantID = state => state.trackers.restaurant_id

export const selectTrackedRestaurantRoot = createSelector(
    selectRestaurants,
    selectTrackedRestaurantID,
    (restaurants, restaurant_id) => restaurants[restaurant_id] ?? emptyObject
)

export const selectTrackedRestaurant = createSelector(
    selectTrackedRestaurantRoot,
    restaurantRoot => restaurantRoot.restaurant ?? emptyObject
)

export const selectRestaurantName = createSelector(
    selectTrackedRestaurant,
    restaurant => restaurant.name ?? ''
)

export const selectIsRestaurantOffline = createSelector(
    selectTrackedRestaurant,
    restaurant => !restaurant.status?.state || restaurant.status.state === 'offline'
)

export const selectRestaurantIsOrderEnabled = createSelector(
    selectTrackedRestaurant,
    restaurant => restaurant.is_order_enabled ?? false
)

export const selectRestaurantIsPayEnabled = createSelector(
    selectTrackedRestaurant,
    restaurant => restaurant.is_pay_enabled ?? false
)

export const selectRestaurantGratuities = createSelector(
    selectTrackedRestaurant,
    restaurant => restaurant.gratuities ?? emptyObject
)

export const selectRestaurantChargeGratuity = createSelector(
    selectRestaurantGratuities,
    gratuities => gratuities.is_charge_tip_enabled && (gratuities.charge?.default_option ?? '?')
)

export const selectMealName = createSelector(
    selectTrackedRestaurant,
    selectTrackedMealID,
    (restaurant, meal_id) => restaurant.meals?.[meal_id]?.name ?? '?'
)

export const selectRestaurantConnectID = createSelector(
    selectIsStripeTestMode,
    selectTrackedRestaurant,
    (isStripeTestMode, restaurant) => restaurant.stripe?.[isStripeTestMode ? 'test' : 'live']?.connect_id ?? ''
)