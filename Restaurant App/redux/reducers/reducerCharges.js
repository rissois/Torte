const initialCharges = {}

export default function charges(state = initialCharges, action) {
    switch (action.type) {
        case 'charges/SET_TIMERS':
            Object.keys(action.timers).forEach(bill_id => {
                if (state[bill_id]) {
                    clearTimeout(state[bill_id])
                }
            })
            return {
                ...state,
                ...action.timers
            }
        case 'charges/DELETE_TIMERS': {
            let copy = { ...state }
            let isAltered = false

            action.bill_ids.forEach(bill_id => {
                if (copy[bill_id]) {
                    clearTimeout(copy[bill_id])
                    isAltered = true
                    delete copy[bill_id]
                }
            })
            if (isAltered) return copy
            return state
        }
        case 'app/RESET':
            return initialCharges
        default:
            return state;
    }
}