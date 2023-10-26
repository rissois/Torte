import { createSelector } from 'reselect'
import { singleSubtotal } from '../../utils/functions/singleSubtotal'

const emptyObject = {}
const emptyArray = []

const selectSelections = state => state.selections
export const selectFilterSelections = state => state.selections.filters
export const selectSizeSelection = state => state.selections.size
export const selectModifierSelections = state => state.selections.modifiers
export const selectUpsellSelections = state => state.selections.upsells

export const selectSelectionSubtotal = createSelector(
    selectSelections,
    selections => singleSubtotal(selections)
)

export const selectModifierSelectionOptions = (modifier_id) => createSelector(
    selectModifierSelections,
    modifierSelections => modifierSelections[modifier_id]?.options || emptyArray
)

export const selectModifierSelectionQuantity = (modifier_id) => createSelector(
    selectModifierSelectionOptions(modifier_id),
    options => options.reduce((acc, option) => acc + option.quantity, 0) ?? 0
)

export const selectModifierOptionSelectionQuantity = ({ id, variant_id }, modifier_id) => createSelector(
    selectModifierSelectionOptions(modifier_id),
    options => options.find(option => option.id === id && option.option_variant_id === option_variant_id)?.quantity ?? 0
)

export const selectUpsellOptionSelectionQuantity = ({ id, option_variant_id }) => createSelector(
    selectUpsellSelections,
    selectedUpsells => selectedUpsells.find(upsell => upsell.id === id && upsell.option_variant_id === option_variant_id)?.quantity ?? 0
)


