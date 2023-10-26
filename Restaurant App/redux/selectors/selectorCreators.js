import { shallowEqual } from 'react-redux'
import { createSelectorCreator, defaultMemoize } from 'reselect'


export const createShallowEqualSelector = createSelectorCreator(
    defaultMemoize,
    shallowEqual
)