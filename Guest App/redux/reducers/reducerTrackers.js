export const initialItemTrackers = {
    section_id: '',
    item_id: '',
    variant_id: '',
    panel_id: '',
    bill_group_id: '',
    user_id: '',
}

export const initialMenuTrackers = {
    dotw_id: '',
    period_id: '',
    meal_id: '',
    menu_id: '',
    menuPosition: '',
    ...initialItemTrackers
}

const initialTrackers = {
    restaurant_id: '',
    bill_id: '', // No bill_id = menu view
    receipt_id: '',
    ...initialMenuTrackers,
}


export default function tracker(state = initialTrackers, action) {
    switch (action.type) {
        // SETS BILL_CART_GROUP, and only closes the Item modal if action finishes with same bill_group
        case 'firestore/START_BILL_GROUP':
            return {
                ...state,
                bill_group_id: action.id,
            }
        // case 'firestore/FAIL_BILL_GROUP':
        case 'firestore/SUCCESS_BILL_GROUP':
            return action.id === state.bill_group_id ? { ...state, ...initialItemTrackers } : state

        case 'trackers/SET_TRACKERS':
            return {
                ...state,
                ...action.trackers,
            }
        case 'trackers/CLEAR_ITEM_TRACKERS':
            return {
                ...state,
                ...initialItemTrackers,
            }
        case 'trackers/CLEAR_MENU_TRACKERS':
            return {
                ...state,
                ...initialMenuTrackers,
            }
        case 'trackers/CLEAR_TRACKERS':
        case 'app/RESET':
            return initialTrackers
        default:
            return state;
    }
}

