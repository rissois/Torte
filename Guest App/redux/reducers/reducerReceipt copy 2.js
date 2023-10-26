const receiptTemplate = {
    id: '',
    restaurant: { name: '' },
    is_approved: false,
    is_deleted: false,
    summary: {
        subtotal: 0,
        tax: 0,
        total: 0,
        tips: 0,
        gratuity: 0,
        final: 0,
    },
    user_ids: [],
    user_statuses: {},
    timestamps: { created: null, scanned: null },
    bill_item_ids: {
        claimed: [],
        ordered: [],
    }
}

const INTIAL_RECEIPT = {
    receipt: receiptTemplate,
    receiptItems: {},
    receiptUsers: {},
    receiptGroups: {},
    isEditing: false,
}

const editGroups = (groups, item, isDeleted) => {
    const { group_id } = item
    const splitStatus = Object.keys(item.units.claimed).length ? 'claimed' : 'unclaimed'
    if (groups[group_id]) {
        if (isDeleted) {
            if (groups[group_id].quantity > 1) {
                return {
                    ...groups,
                    [group_id]: {
                        ...groups[group_id],
                        [splitStatus]: groups[group_id][splitStatus].filter(id => id !== item.id)
                    }
                }
            }
            const copy = { ...groups }
            delete groups[group_id]
            return copy
        }
        return {
            ...groups,
            [group_id]: {
                ...groups[group_id],
                subtotal: groups[group_id].subtotal + item.subtotal,
                quantity: groups[group_id].quantity + 1,
                [splitStatus]: [...groups[group_id][splitStatus], item.id]
            }
        }
    }
    if (isDeleted) return groups
    return {
        ...groups,
        [group_id]: {
            name: item.name,
            captions: item.captions,
            position: item.position,
            subtotal: item.summary.subtotal,
            quantity: 1, // Technically can use unclaimed.length + claimed.length
            unclaimed: [],
            claimed: [],
            [splitStatus]: [item.id]
        }
    }
}


export default function receipt(state = INTIAL_RECEIPT, action) {
    if (action.category === 'receiptItems') {
        switch (action.type) {
            case 'receipt/UPDATE_RECEIPT_CHILDREN': {
                let receiptGroups = { ...state.receiptGroups }
                Object.keys(action.obj).forEach(id => receiptGroups = editGroups(receiptGroups, action.obj[id]))
                return {
                    ...state,
                    receiptItems: {
                        ...state.receiptItems,
                        ...action.obj,
                    },
                    receiptGroups
                }
            }
            case 'receipt/DELETE_RECEIPT_CHILDREN': {
                const receiptItems = { ...state.receiptItems }
                Object.keys(action.obj).forEach(id => delete receiptItems[id])

                let receiptGroups = { ...state.receiptGroups }
                Object.keys(action.obj).forEach(id => editGroups(receiptGroups, action.obj[id]))

                return { ...state, receiptItems, receiptGroups }
            }
        }
    }

    switch (action.type) {
        case 'receipt/UPDATE_RECEIPT_CHILDREN':
            return {
                ...state,
                [action.category]: {
                    ...state[action.category],
                    ...action.obj,
                }
            }
        case 'receipt/DELETE_RECEIPT_CHILDREN':
            const category = { ...state[action.category] }
            Object.keys(action.obj).forEach(id => delete category[id])
            return { ...state, [action.category]: category }
        case 'receipt/IS_EDITING':
            return { ...state, isEditing: action.isEditing }
        case 'receipt/REMOVE_RECEIPT':
        case 'app/RESET':
            return INTIAL_RECEIPT

        default:
            return state;
    }
}

