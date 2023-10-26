import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'

const emptyObject = {}

export const selectListeners = state => state.listeners

export const selectListenersPending = createSelector(
    selectListeners,
    listeners => Object.keys(listeners).find(listener => !listeners[listener])
)