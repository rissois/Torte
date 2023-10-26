import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'

const emptyObject = {}

const selectRestaurants = state => state.restaurants
const selectTrackedRestaurantID = state => state.trackers.restaurant_id

export const selectTrackedRestaurant = createSelector(
    selectRestaurants,
    selectTrackedRestaurantID,
    (restaurants, restaurant_id) => restaurants[restaurant_id] ?? emptyObject
)

export const selectTrackedRestaurantOrCollection = collection => createSelector(
    selectTrackedRestaurant,
    restaurant => restaurant?.[collection || 'restaurant'] ?? emptyObject
)

export const selectDocumentFromTrackedRestaurantCollection = (collection, id) => createSelector(
    selectTrackedRestaurantOrCollection(collection),
    collection => collection?.[id] ?? emptyObject
)

export const selectNestedFieldFromTrackedRestaurant = (...fields) => createSelector(
    selectTrackedRestaurantOrCollection(),
    restaurant => recursiveFieldGetter(restaurant, ...fields)
)

export const selectNestedFieldFromTrackedRestaurantCollection = (collection, id, ...fields) => createSelector(
    selectTrackedRestaurantOrCollection(collection, id),
    document => recursiveFieldGetter(document, ...fields)
)