import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'
import { createShallowEqualSelector } from './selectorCreators'
import { selectNestedFieldFromBill } from './selectorsBills'

const emptyObject = {}
const emptyArray = []

export const selectApp = state => state.app.dietaryFilters
export const selectDietaryFilters = state => state.app.dietaryFilters
