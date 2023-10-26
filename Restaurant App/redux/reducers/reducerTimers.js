const initialTimers = {}

export default function timers(state = initialTimers, action) {
    switch (action.type) {
        case 'timers/SET_TIMERS':
            Object.keys(action.timers).forEach(bill_order_id => {
                if (state[bill_order_id]) {
                    clearTimeout(state[bill_order_id])
                }
            })
            return {
                ...state,
                ...action.timers
            }
        case 'timers/DELETE_TIMERS': {
            let copy = { ...state }
            let isAltered = false

            action.bill_order_ids.forEach(bill_order_id => {
                if (copy[bill_order_id]) {
                    clearTimeout(copy[bill_order_id])
                    isAltered = true
                    delete copy[bill_order_id]
                }
            })
            if (isAltered) return copy
            return state
        }
        case 'app/RESET':
            return initialTimers
        default:
            return state;
    }
}