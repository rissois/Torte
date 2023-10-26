const initialUnpaid = {
    pending: [],
    recovered: [],
    failed: [],
    completed: []
}

const addOrMoveUnpaidBill = (stateCopy, status, bill_id) => {
    if (status && stateCopy[status].includes(bill_id)) return false

    let isAltered = false
    Object.keys(stateCopy).forEach(other => {
        if (other === status) {
            isAltered = true
            stateCopy[other] = [...stateCopy[other], bill_id]
        }
        else if (stateCopy[other].includes(bill_id)) {
            isAltered = true
            stateCopy[other] = stateCopy[other].filter(id => id !== bill_id)
        }
    })
    return isAltered
}

export default function unpaid(state = initialUnpaid, action) {
    switch (action.type) {
        case 'bills/SET_BILLS': {
            let copy = { ...state }
            let isAltered = false

            Object.keys(action.obj).forEach(bill_id => {
                const { timestamps, order_summary, paid_summary } = action.obj[bill_id]
                if (!timestamps.unpaid) {
                    isAltered += addOrMoveUnpaidBill(copy, undefined, bill_id)
                }
                // A charge attempt was made
                else if (timestamps.charged) {
                    if (order_summary.total > paid_summary.total) {
                        isAltered += addOrMoveUnpaidBill(copy, 'failed', bill_id)
                    }
                    else {
                        isAltered += addOrMoveUnpaidBill(copy, 'recovered', bill_id)
                    }
                }
                // A charge has not been attempted
                else {
                    if (order_summary.total > paid_summary.total) {
                        isAltered += addOrMoveUnpaidBill(copy, 'pending', bill_id)
                    }
                    else {
                        isAltered += addOrMoveUnpaidBill(copy, 'completed', bill_id)
                    }
                }
            })

            if (isAltered) return copy
            return state
        }
        case 'bills/DELETE_BILLS':
            let copy = { ...state }
            let isAltered = false

            const deleted_bill_ids = Object.keys(action.obj)
            // Filter out deleted bills, only replace state if a bill was removed
            Object.keys(copy).forEach(status => {
                let temp = copy[status].filter(bill_id => !deleted_bill_ids.includes(bill_id))
                if (temp.length !== copy[status].length) {
                    isAltered = true
                    copy[status] = temp
                }
            })

            if (isAltered) return copy
            return state
        case 'app/RESET':
            return initialUnpaid
        default:
            return state;
    }
}