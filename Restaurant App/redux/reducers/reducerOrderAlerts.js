const initialOrderAlerts = []

/* 
    CONTINUOUS
    If two orders come in first minutes apart, and the oldest order is fully marked
    The newest order should MAINTAIN that oldestContinuousOrder time

    This is because any overlapping table items should be prepared together and not overlooked
*/

const checkIfBillItemIsInOrderAlert = (orderAlerts, table_id, bill_item_id) => orderAlerts[table_id]?.bill_item_ids.includes(bill_item_id)

export default function orderAlerts(state = initialOrderAlerts, action) {
    switch (action.type) {
        case 'billItems/SET_BILLITEMS': {
            let orderAlerts = { ...state }
            let isAltered = false

            Object.keys(action.obj).forEach(bill_item_id => {
                const { table_id, timestamps: { created, marked, printed, closed }, voided: { is_voided }, user_id } = action.obj[bill_item_id]

                if (user_id === 'server') return

                const isBillItemInOrderAlert = checkIfBillItemIsInOrderAlert(orderAlerts, table_id, bill_item_id)

                if (!marked && !printed && !is_voided && !closed && !isBillItemInOrderAlert) {
                    if (!orderAlerts[table_id]) orderAlerts[table_id] = { created: created.toMillis(), bill_item_ids: [bill_item_id] }
                    else {
                        orderAlerts[table_id] = {
                            ...orderAlerts[table_id],
                            created: Math.min(orderAlerts[table_id].created, created.toMillis()),
                            bill_item_ids: [...orderAlerts[table_id].bill_item_ids, bill_item_id]
                        }
                    }
                    isAltered = true
                }
                else if ((marked || closed || printed || is_voided) && isBillItemInOrderAlert) {
                    if (orderAlerts[table_id].bill_item_ids.length === 1) delete orderAlerts[table_id]
                    else {
                        orderAlerts[table_id] = {
                            ...orderAlerts[table_id],
                            bill_item_ids: orderAlerts[table_id].bill_item_ids.filter(id => id !== bill_item_id)
                        }
                    }
                    isAltered = true
                }
            })

            if (isAltered) return orderAlerts
            return state
        }
        case 'billItems/DELETE_BILLITEMS': {
            let orderAlerts = { ...state }
            let isAltered = false

            Object.keys(action.obj).forEach(bill_item_id => {
                const { table_id, user_id } = action.obj[bill_item_id]
                if (user_id === 'server') return

                if (checkIfBillItemIsInOrderAlert(orderAlerts, table_id, bill_item_id)) {
                    if (orderAlerts[table_id].bill_item_ids.length === 1) delete orderAlerts[table_id]
                    else {
                        orderAlerts[table_id] = {
                            ...orderAlerts[table_id],
                            bill_item_ids: orderAlerts[table_id].bill_item_ids.filter(id => id !== bill_item_id)
                        }
                    }
                    isAltered = true
                }
            })

            if (isAltered) return orderAlerts
            return state
        }
        // case 'billItems/DELETE_BILLITEMS_CHILD': {
        // }
        case 'app/RESET':
            return initialOrderAlerts
        default:
            return state;
    }
}

