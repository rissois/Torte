export const initialFirestore = {
    pending_bill_group_ids: [],
    claiming_bill_item_ids: [],
    responded_to_order: 0, // store as millis
    // is_paying_all: true,
}

export default function firestore(state = initialFirestore, action) {
    switch (action.type) {
        case 'firestore/RESPONDED_TO_ORDER': {
            return {
                ...state,
                responded_to_order: action.millis
            }
        }
        case 'firestore/START_BILL_GROUP':
            return {
                ...state,
                pending_bill_group_ids: state.pending_bill_group_ids.concat(action.id)
            }
        case 'firestore/SUCCESS_BILL_GROUP':
        case 'firestore/FAIL_BILL_GROUP':
            return {
                ...state,
                pending_bill_group_ids: state.pending_bill_group_ids.filter(id => id !== action.id)
            }

        case 'firestore/START_PAY_SPLIT':
            return {
                ...state,
                claiming_bill_item_ids: state.claiming_bill_item_ids.concat(action.bill_item_ids)
            }
        case 'firestore/SUCCESS_PAY_SPLIT':
        case 'firestore/FAIL_PAY_SPLIT':
            return {
                ...state,
                claiming_bill_item_ids: state.claiming_bill_item_ids.filter(id => !action.bill_item_ids.includes(id))
            }
        case 'app/RESET':
            return initialFirestore;
        default:
            return state;
    }
}