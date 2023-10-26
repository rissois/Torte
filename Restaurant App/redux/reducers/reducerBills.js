const initialBills = {}

// MAKE SURE TO ADD DATE FOR BILLS!! maybe bill items too...

export default function bills(state = initialBills, action) {
    switch (action.type) {
        case 'bills/SET_BILLS':
        case 'bills/SET_BILLS_TEMP': {
            return { ...state, ...action.obj }
        }
        case 'bills/DELETE_BILLS': {
            const bills = { ...state }
            Object.keys(action.obj).forEach(id => delete bills[id])
            return bills
        }
        case 'bills/DELETE_BILLS_TEMP': {
            const bills = { ...state }
            let isAltered = false
            Object.keys(bills).forEach(bill_id => {
                if (bills[bill_id]?.timestamps?.closed) {
                    delete bills[bill_id]
                    isAltered = true
                }
            })
            if (isAltered) return bills
            return state
        }
        case 'app/RESET':
            return initialBills
        default:
            return state;
    }
}

