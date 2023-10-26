import { getFirestore, collection, doc, } from 'firebase/firestore'
import firebaseApp from '../../firebase/firebase';

const firestore = getFirestore(firebaseApp)

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
}

const identicalArrays = (a1, a2) => a1.every((s, i) => s === a2[i])

const matchingGroup = (item, group) => group.name === item.name
    && (
        group.subtotal === item.summary.subtotal
        || (!group.subtotalWiggle && Math.abs(group.subtotal - item.summary.subtotal) === 1)
        || (group.subtotalWiggle === group.subtotal - item.summary.subtotal)
    )
    && group.position === item.position
    && identicalArrays(group.captions, item.captions)

const editGroups = (groups, item, isDeleted) => {
    const existingGroupID = null
    const isInGroupUnclaimed = null
    const matchingGroupID = isDeleted ? 'delete' : null
    for (let i = 0, groupIDs = Object.keys(groups); i < groupIDs.length && !existingGroupID && !matchingGroupID; i++) {
        const groupID = groupIDs[i]
        const group = groups[groupID]

        if (!matchingGroupID && matchingGroup(item, group)) matchingGroupID = groupID
        if (!existingGroupID) {
            if (group.unclaimed.includes(item.id)) {
                existingGroupID = groupID
                isInGroupUnclaimed = true
            }
            else if (group.claimed.includes(item.id)) existingGroupID = groupID
        }
    }

    const isItemUnclaimed = !Object.keys(item.units.claimed).length
    const itemBin = isItemUnclaimed ? 'unclaimed' : 'claimed'

    // Add item to existing group
    if (matchingGroupID && !isDeleted && (matchingGroupID !== existingGroupID || isInGroupUnclaimed !== isItemUnclaimed)) {
        groups = {
            ...groups,
            [matchingGroupID]: {
                ...groups[matchingGroupID],
                quantity: groups[matchingGroupID].quantity + 1,
                [itemBin]: [...groups[matchingGroupID][itemBin], item.id],
            }
        }
    }
    // Remove item from wrong group
    if (existingGroupID && (matchingGroupID !== existingGroupID || isInGroupUnclaimed !== isItemUnclaimed)) {
        const groupBin = isInGroupUnclaimed ? 'unclaimed' : 'claimed'
        groups = {
            ...groups,
            [existingGroupID]: {
                ...groups[existingGroupID],
                quantity: groups[existingGroupID].quantity + 1,
                [groupBin]: groups[existingGroupID][groupBin].filter(id => id !== item.id)
            }
        }

        // Delete group entirely if now empty
        if (!groups[existingGroupID].unclaimed.length && !groups[existingGroupID].claimed.length) {
            delete groups[existingGroupID]
        }
    }

    // Create new group
    if (!matchingGroupID && !isDeleted) {
        const randomGroupID = doc(collection(firestore, 'fake')).id
        groups = {
            ...groups,
            [randomGroupID]: {
                name: item.name,
                captions: item.captions,
                position: item.position,
                subtotal: item.summary.subtotal,
                subtotalWiggle: 0,
                quantity: 1, // Technically can use unclaimed.length + claimed.length
                unclaimed: [],
                claimed: [],
                [itemBin]: [item.id],
            }
        }
    }

    return groups
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
        case 'receipt/REMOVE_RECEIPT':
        case 'app/RESET':
            return INTIAL_RECEIPT

        default:
            return state;
    }
}

