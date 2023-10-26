import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'

const emptyObject = {}

export const selectRestaurant = state => state.restaurant

export const selectNestedFieldFromRestaurant = (...fields) => createSelector(
    selectRestaurant,
    restaurant => recursiveFieldGetter(restaurant, ...fields)
)