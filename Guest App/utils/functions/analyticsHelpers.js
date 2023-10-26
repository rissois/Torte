const itemIDsReducer = (acc, curr) => curr.item_id ? [...acc, curr.item_id] : acc
const optionIDsReducer = (acc, curr) => curr.option_id ? [...acc, curr.option_id] : acc
const compositeIDsReducer = (acc, curr) => [...acc, curr.variant_id || curr.option_id || curr.item_id]

export const createBillItemAnalytics = (selections, day_id, day_created, is_panel_click) => ({
  day_id,
  day_created,
  filter_ids: Object.keys(selections.filters),
  is_panel_click,
  modifier_ids: Object.keys(selections.modifiers),
  mod_item_ids: Object.keys(selections.modifiers).reduce((acc, modifier_id) => {
    return [...acc, ...selections.modifiers[modifier_id].mods.reduce(itemIDsReducer, [])]
  }, []),
  mod_option_ids: Object.keys(selections.modifiers).reduce((acc, modifier_id) => {
    return [...acc, ...selections.modifiers[modifier_id].mods.reduce(optionIDsReducer, [])]
  }, []),
  mod_ids: Object.keys(selections.modifiers).reduce((acc, modifier_id) => {
    return [...acc, ...selections.modifiers[modifier_id].mods.reduce(compositeIDsReducer, [])]
  }, []),
  upsell_item_ids: selections.upsells.reduce(itemIDsReducer, []),
  upsell_option_ids: selections.upsells.reduce(optionIDsReducer, []),
  upsell_ids: selections.upsells.reduce(compositeIDsReducer, []),
})