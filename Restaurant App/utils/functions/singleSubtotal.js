export const singleSubtotal = ({ size, filters, modifiers, upsells, custom = [], comped = {} }) => {
  let subtotal = 0

  subtotal += size?.price ?? 0

  Object.values(filters).forEach(val => typeof val === 'number' && (subtotal += val))

  upsells.forEach(upsell => subtotal += upsell.price * (upsell.quantity - upsell.upsell_first_free))

  custom.forEach(c => subtotal += c.price)

  Object.keys(modifiers).forEach(modifier_id => {
    let remainingFree = modifiers[modifier_id].modifier_first_free

    modifiers[modifier_id].mods.sort((a, b) => b.price - a.price).forEach(mod => {
      if (remainingFree >= mod.quantity) {
        remainingFree -= mod.quantity
      }
      else {
        subtotal += mod.price * (mod.quantity - remainingFree)
        remainingFree = 0
      }
    })
  })

  if (comped?.percent) {
    comped.subtotal = Math.round(comped.percent * subtotal / 100)
  }
  else {
    comped.subtotal = 0
  }
  subtotal -= comped?.subtotal || 0

  return subtotal
}