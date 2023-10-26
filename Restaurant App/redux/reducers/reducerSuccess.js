const initialSuccess = false;

export default function success(state = initialSuccess, action) {
    // Not sure how to handle this atomically
    switch (action.type) {
        case 'success/ADD_SUCCESS':
            return Date.now()
        case 'success/REMOVE_SUCCESS':
            if (action.time === state) return false
            return state
        case 'success/RESET_SUCCESS':
        case 'app/RESET':
            return initialSuccess
        default:
            return state
    }
}