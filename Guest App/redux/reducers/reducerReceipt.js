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
    uri: '',
}

const NO_ITEM = { name: '', summary: { subtotal: 0 }, captions: [], position: -1, }
const editGroups = (groups, item, reduxItem,) => {
    const group_id = item?.group_id || reduxItem?.group_id

    if (!item && !reduxItem) return groups

    if (groups[group_id]) {
        const deltaQuantity = item ? reduxItem ? 0 : 1 : -1
        if (!item) item = NO_ITEM
        if (!reduxItem) reduxItem = NO_ITEM
        const deltaName = item.name !== reduxItem.name
        const deltaPosition = item.position !== reduxItem.position
        const deltaSubtotal = item.summary.subtotal - reduxItem.summary.subtotal
        const deltaCaptions = item.captions.some((c, i) => c !== reduxItem.captions[i])

        // NO CHANGE
        if (!deltaQuantity && !deltaName && !deltaPosition && !deltaSubtotal && !deltaCaptions) {
            return groups
        }

        const group = { ...groups[group_id] }

        group.quantity += deltaQuantity
        // DELETE GROUP
        if (!group.quantity) {
            let copy = { ...groups }
            delete groups[group_id]
            return copy
        }

        if (deltaName) group.name = item.name
        if (deltaPosition) group.position = item.position
        if (deltaCaptions) group.captions = item.captions
        if (deltaSubtotal) group.subtotal += deltaSubtotal

        const splitStatus = !item.units ? null : Object.keys(item.units.claimed).length ? 'claimed' : 'unclaimed'
        const reduxStatus = !reduxItem.units ? null : Object.keys(reduxItem.units.claimed).length ? 'claimed' : 'unclaimed'
        if (reduxStatus !== splitStatus) {
            if (reduxStatus) group[reduxStatus] = group[reduxStatus].filter(id => id !== item.id)
            if (splitStatus) group[splitStatus] = [...group[splitStatus], item.id]
        }

        return { ...groups, [group_id]: group }
    }
    else {
        return {
            ...groups,
            [group_id]: {
                name: item.name,
                position: item.position,
                captions: item.captions,
                subtotal: item.summary.subtotal,
                quantity: 1,
                claimed: [],
                unclaimed: [],
                [Object.keys(item.units.claimed).length ? 'claimed' : 'unclaimed']: [item.id],
            }
        }
    }



}


export default function receipt(state = INTIAL_RECEIPT, action) {
    if (action.category === 'receiptItems') {
        switch (action.type) {
            case 'receipt/UPDATE_RECEIPT_CHILDREN': {
                let receiptGroups = { ...state.receiptGroups }
                Object.keys(action.obj).forEach(id => receiptGroups = editGroups(receiptGroups, action.obj[id], state.receiptItems[id]))
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
                Object.keys(action.obj).forEach(id => editGroups(receiptGroups, null, state.receiptItems[id]))

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
        case 'receipt/SET_URI':
            return { ...state, uri: action.uri }
        case 'receipt/REMOVE_RECEIPT':
        case 'app/RESET':
            return INTIAL_RECEIPT

        default:
            return state;
    }
}

