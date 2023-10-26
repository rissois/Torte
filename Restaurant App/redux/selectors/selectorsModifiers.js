import { createSelector } from 'reselect'

const emptyObject = {}
const emptyArray = []

export const selectModifiers = state => state.modifiers

export const selectRequiredModifiers = createSelector(
    selectModifiers,
    modifiers => Object.keys(modifiers).filter(modifier_id => modifiers[modifier_id].min)
)

