const initialSelections = {
    size: null,
    filters: {},
    upsells: [],
    modifiers: {},
}


const toggleModifier = (selectedModifiers, modifier, isMaxOfOne, mod, increment) => {
    const { modifier_id } = modifier

    if (!selectedModifiers[modifier_id] || isMaxOfOne) {
        return {
            ...selectedModifiers,
            [modifier_id]: {
                ...modifier,
                mods: [{ ...mod, quantity: 1 }]
            }
        }
    }

    let mods = [...selectedModifiers[modifier_id].mods]
    const index = mods.findIndex(existing => existing.item_id === mod.item_id && existing.option_id === mod.option_id && existing.variant_id === mod.variant_id)

    if (~index) {
        if (!increment || mods[index].quantity + increment <= 0) {
            if (mods.length === 1) {
                const { [modifier_id]: discard, ...keep } = selectedModifiers
                return keep
            }
            mods.splice(index, 1)
        }
        else {
            mods[index].quantity += increment
        }

        return {
            ...selectedModifiers,
            [modifier_id]: {
                ...selectedModifiers[modifier_id],
                mods
            }
        }
    }
    return {
        ...selectedModifiers,
        [modifier_id]: {
            ...selectedModifiers[modifier_id],
            mods: [...mods, { ...mod, quantity: 1 }]
        }
    }
}


const toggleFilter = (selectedFilters, key, price) => {
    if (selectedFilters.hasOwnProperty(key)) {
        let next = { ...selectedFilters }
        delete next[key]
        return next
    }
    return { ...selectedFilters, [key]: price }
}

// !increment === toggle quantity = 1 or remove entirely
// upsell also carries name, price, and upsell_first_free
const incrementUpsell = (selectedUpsells, upsell, increment) => {
    const index = selectedUpsells.findIndex(existing => existing.item_id === upsell.item_id && existing.option_id === upsell.option_id && existing.variant_id === upsell.variant_id)

    if (~index) {
        let next = [...selectedUpsells]
        if (!increment || selectedUpsells[index].quantity + increment <= 0) {
            next.splice(index, 1)
            return next
        }
        next[index].quantity += increment
        return next
    }
    return [...selectedUpsells, { ...upsell, quantity: 1 }]
}

export default function selections(state = initialSelections, action) {
    switch (action.type) {
        case 'selections/INITIALIZE':
            return action.selections
        case 'selections/TOGGLE_SIZE':
            return { ...state, size: action.size }
        case 'selections/TOGGLE_MODIFIER':
            return { ...state, modifiers: toggleModifier(state.modifiers, action.modifier, action.isMaxOfOne, action.mod, action.increment) }
        case 'selections/TOGGLE_FILTER':
            return { ...state, filters: toggleFilter(state.filters, action.key, action.price) }
        case 'selections/TOGGLE_UPSELL':
            return { ...state, upsells: incrementUpsell(state.upsells, action.upsell, action.increment) }
        case 'firestore/SUCCESS_BILL_GROUP':
        case 'trackers/CLEAR_ITEM':
        case 'trackers/CLEAR_ITEM_TRACKERS':
        case 'app/RESET':
            return initialSelections
        default:
            return state;
    }
}

