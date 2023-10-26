export const doSelectionsInitialize = (selections) => {
    return { type: 'selections/INITIALIZE', selections }
}

export const doSelectionsSizeToggle = (size) => {
    return { type: 'selections/TOGGLE_SIZE', size }
}

export const doSelectionsModifierToggle = (modifier, isMaxOfOne, mod, increment,) => {
    return { type: 'selections/TOGGLE_MODIFIER', modifier, isMaxOfOne, mod, increment, }
}

export const doSelectionsFilterToggle = (key, price) => {
    return { type: 'selections/TOGGLE_FILTER', key, price }
}


export const doSelectionsUpsellToggle = (upsell, increment) => {
    return { type: 'selections/TOGGLE_UPSELL', upsell, increment }
}
