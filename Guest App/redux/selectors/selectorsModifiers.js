import { createSelector } from 'reselect'
import { createShallowEqualSelector } from './selectorCreators'
import { selectTrackedItem } from './selectorsItems'
import { selectTrackedRestaurantRoot } from './selectorsRestaurant2'
import { selectModifierSelections } from './selectorsSelections'

const emptyObject = {}
const emptyArray = []

export const selectModifiers = createSelector(
    selectTrackedRestaurantRoot,
    restaurantRoot => restaurantRoot.modifiers ?? emptyObject
)

export const selectModifier = (modifier_id) => createSelector(
    selectModifiers,
    modifiers => modifiers[modifier_id] ?? emptyObject
)

export const selectIncompleteModifiers = createSelector(
    selectTrackedItem,
    selectModifiers,
    selectModifierSelections,
    (item, modifiers, selections) => item.modifier_ids?.reduce((acc, modifier_id) => {
        if (modifiers[modifier_id].min && (selections[modifier_id]?.mods.reduce((acc, mod) => acc + mod.quantity, 0) ?? 0) < modifiers[modifier_id].min) {
            return [...acc, { modifier_id, name: modifiers[modifier_id].name }]
        }
        return acc
    }, []) ?? emptyArray
)