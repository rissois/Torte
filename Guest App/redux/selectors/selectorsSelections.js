import { createSelector } from "reselect"

const emptyObject = {}

// most others are found with their respective files
export const selectSelections = state => state.selections

export const selectSubtotalFromSelections = createSelector(
    selectSelections,
    selections => 0
)

export const selectSizeSelection = createSelector(
    selectSelections,
    selections => selections.size
)

export const selectUpsellSelections = createSelector(
    selectSelections,
    selections => selections.upsells
)

export const selectUpsellSelectedQuantity = ({ item_id, option_id, variant_id }) => createSelector(
    selectUpsellSelections,
    upsellSelections => upsellSelections.find(upsell => upsell.item_id === item_id && upsell.option_id === option_id && upsell.variant_id === variant_id)?.quantity || 0
)

export const selectFilterSelections = createSelector(
    selectSelections,
    selections => selections.filters
)

export const selectIsFilterSelected = (key) => createSelector(
    selectFilterSelections,
    filterSelections => filterSelections.hasOwnProperty(key)
)

export const selectModifierSelections = createSelector(
    selectSelections,
    selections => selections.modifiers
)

export const selectModifierSelection = (modifier_id) => createSelector(
    selectModifierSelections,
    modifiers => modifiers[modifier_id] ?? emptyObject
)

export const selectModifierSelectedQuantity = (modifier_id) => createSelector(
    selectModifierSelection(modifier_id),
    modifier => modifier.mods?.reduce((acc, option) => acc + option.quantity, 0) ?? 0
)

export const selectModSelectedQuantity = (modifier_id, { item_id, option_id, variant_id }) => createSelector(
    selectModifierSelection(modifier_id),
    modifier => modifier.mods?.find(mod => mod.item_id === item_id && mod.option_id === option_id && mod.variant_id === variant_id)?.quantity ?? 0
)

// export const selectIsModifierSelected = createSelector(
//     selectModifierSelections,
//     modifierSelections => selections.modifiers
// )