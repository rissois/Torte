import { createSelector } from 'reselect'
import arrayToCommaList from '../../utils/functions/arrayToCommaList'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'
import { initialFilters } from '../reducers/reducerFilters'
import { createShallowEqualSelector } from './selectorCreators'


const emptyObject = {}
const emptyArray = []

export const selectFilters = state => state.filters

export const selectActiveFilterKeys = createSelector(
    selectFilters,
    filters => Object.keys(filters).filter(key => filters[key].on)
)

export const selectActiveFilterNames = createShallowEqualSelector(
    selectActiveFilterKeys,
    activeFilterKeys => arrayToCommaList(activeFilterKeys.map(key => initialFilters[key].name.toLowerCase()))
)
