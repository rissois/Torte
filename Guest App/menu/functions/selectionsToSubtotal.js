export const selectionsToSubtotal = (selections) => {
    let subtotal = 0

    subtotal += selections.size?.price ?? 0

    Object.values(selections.filters).forEach(val => subtotal += val)

    selections.upsells.forEach(upsell => subtotal += upsell.price * (upsell.quantity - upsell.upsell_first_free))

    Object.keys(selections.modifiers).forEach(modifier_id => {
        let remainingFree = selections.modifiers[modifier_id].modifier_first_free

        selections.modifiers[modifier_id].mods.sort((a, b) => b.price - a.price).forEach(mod => {
            if (remainingFree >= mod.quantity) {
                remainingFree -= mod.quantity
            }
            else {
                subtotal += mod.price * (mod.quantity - remainingFree)
                remainingFree = 0
            }
        })
    })

    return subtotal
}