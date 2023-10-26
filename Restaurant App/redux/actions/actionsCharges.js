import firebase from "firebase"
import { doAlertAdd } from "./actionsAlerts"


export const TEN_MINUTE_UNPAID_DELAY = 600000
// export const TEN_MINUTE_UNPAID_DELAY = 6000 // 6 second tester

const setChargeTimer = (bill, dispatch) => {
    if (!bill.timestamps.unpaid || bill.timestamps.closed || bill.timestamps.charged) {
        return null
    }

    return setTimeout(() => {
        dispatch(doChargeTransact(bill.id))
    }, bill.timestamps.unpaid.toMillis() + TEN_MINUTE_UNPAID_DELAY - Date.now())
}

export const doChargeInitialize = (obj) => {
    return async function (dispatch) {
        let timers = {}
        for (let i = 0, keys = Object.keys(obj); i < keys.length; i++) {
            const data = obj[keys[i]]
            // if (data.restaurant_id !== firebase.auth().currentUser.uid) return
            let timeout = setChargeTimer(data, dispatch)
            if (timeout) {
                timers[data.id] = timeout
            }
        }
        dispatch(doChargeSet(timers))
    }
}

export const doChargeSet = (timers) => {
    return { type: 'charges/SET_TIMERS', timers }
}

export const doChargeDelete = (bill_id) => {
    return { type: 'charges/DELETE_TIMERS', bill_ids: typeof bill_id === 'string' ? [bill_id] : bill_id }
}


export const doChargeTransact = (bill_id, attempt = 0) => {
    return async function (dispatch, getState) {
        const { id: restaurant_id } = getState().restaurant
        const { bill_code, table: { name: tableName } } = getState().bills[bill_id]

        try {
            console.log("CHARGE")
            await firebase.functions().httpsCallable('charges-initiateCharges')({ bill_id, restaurant_id })
        }
        catch (error) {
            console.log('actionsCharges doChargeTransact error: ', error)
            // if (attempt < 3) dispatch(doChargeTransact(bill_id, attempt + 1))
            dispatch(doAlertAdd('Failed to collect an unpaid bill', [`Bill #${bill_code} at ${tableName}`, error.message || error.code || 'Please let us know if the issue persists']))
        }
    }
}