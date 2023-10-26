import firebase from "firebase"
import calculateTimeRemaining from "../../utils/functions/calculateTimeRemaining"
import { doAlertAdd } from "./actionsAlerts"

/*
Each timer just sets a time
but any SET AS READY or CONFIRM ORDER must transact
*/

const unableToProgress = billOrder => !billOrder.user_ids.length || !billOrder.bill_group_ids.length || billOrder.timestamps.completed || billOrder.paused_user_id

const READY_20_SECONDS = 20000
const WAIT_5_MINUTES = 300000
const PAUSE_2_MINUTES = 120000

const db = firebase.firestore()

const setBillOrderTimer = (billOrder, dispatch) => {
    if (unableToProgress(billOrder)) return doTimersDelete(billOrder.id)

    const { last_activity, ready, auto_paused } = billOrder.timestamps

    if (ready) {
        return setTimeout(() => {
            dispatch(doTimerComplete(billOrder.id))
        }, calculateTimeRemaining(ready, READY_20_SECONDS))
        // 15 second countdown
    }
    // This may be inefficient with auto_pause.... might want to delete auto_pause if after 2 minute mark
    else if (auto_paused || billOrder.wait_user_ids.length) {
        const timeToUnpause = calculateTimeRemaining(auto_paused, PAUSE_2_MINUTES)
        const timeToUnwait = billOrder.wait_user_ids.length ? calculateTimeRemaining(last_activity, WAIT_5_MINUTES) : 0
        const timeToReady = Math.max(timeToUnpause, timeToUnwait)

        return setTimeout(() => {
            dispatch(doTimerComplete(billOrder.id))
        }, timeToReady)
    }
}

export const doTimersInitialize = (obj) => {
    return async function (dispatch,) {
        let timers = {}
        for (let i = 0, keys = Object.keys(obj); i < keys.length; i++) {
            const data = obj[keys[i]]
            // if (data.restaurant_id !== firebase.auth().currentUser.uid) return
            let timeout = setBillOrderTimer(data, dispatch)
            if (timeout) {
                timers[data.id] = timeout
            }
        }
        dispatch(doTimersSet(timers))
    }
}

export const doTimersSet = (timers) => {
    return { type: 'timers/SET_TIMERS', timers }
}

export const doTimersDelete = (bill_order_id) => {
    return { type: 'timers/DELETE_TIMERS', bill_order_ids: typeof bill_order_id === 'string' ? [bill_order_id] : bill_order_id }
}


export const doTimerComplete = (bill_order_id, attempt = 0) => {
    return async function (dispatch, getState) {
        const { id: restaurant_id } = getState().restaurant
        const { bill_id, table_id } = getState().billOrders[bill_order_id]

        if (!bill_id) return null

        const billOrderRef = db.collection('Restaurants').doc(restaurant_id)
            .collection('Bills').doc(bill_id)
            .collection('BillOrders').doc(bill_order_id)

        try {
            await db.runTransaction(async transaction => {
                const billOrderDoc = await transaction.get(billOrderRef)

                if (!billOrderDoc.exists) return null

                const billOrder = billOrderDoc.data()

                const { last_activity, ready, auto_paused } = billOrder.timestamps
                const timeToUnpause = calculateTimeRemaining(auto_paused, PAUSE_2_MINUTES)

                if (unableToProgress(billOrder)) {
                    // Clear auto_pause if the 2 minutes has passed to stop checking it
                    if (timeToUnpause <= 0) {
                        transaction.set(billOrderRef, {
                            timestamps: {
                                auto_paused: null,
                            },
                        }, { merge: true })
                    }

                    return null
                }


                if (ready) {
                    if (calculateTimeRemaining(ready, READY_20_SECONDS) <= 0) {
                        await firebase.functions().httpsCallable('order2-itemize')({
                            restaurant_id,
                            bill_id,
                            bill_order_id,
                            is_pos_completed: true,
                        })
                        dispatch(doTimersDelete(bill_order_id))
                    }
                }
                else if (billOrder.wait_user_ids.length) {
                    const timeToUnwait = billOrder.wait_user_ids.length ? calculateTimeRemaining(last_activity, WAIT_5_MINUTES) : 0

                    if (timeToUnwait <= 0) {
                        transaction.set(billOrderRef, {
                            wait_user_ids: [],
                            timestamps: {
                                ready: firebase.firestore.FieldValue.serverTimestamp(),
                                auto_paused: null,
                            },
                            is_pos_readied: true,
                        }, { merge: true })
                        dispatch(doTimersDelete(bill_order_id))
                    }
                    else if (timeToUnpause <= 0) {
                        // Clear auto_pause if the 2 minutes has passed to stop checking it
                        if (timeToUnpause <= 0) {
                            transaction.set(billOrderRef, {
                                timestamps: {
                                    auto_paused: null,
                                },
                            }, { merge: true })
                        }
                    }
                }
                else if (timeToUnpause <= 0) {
                    transaction.set(billOrderRef, {
                        timestamps: {
                            ready: firebase.firestore.FieldValue.serverTimestamp(),
                            // last_activity: firebase.firestore.FieldValue.serverTimestamp(),
                            auto_paused: null,
                        },
                        is_pos_readied: true,
                    }, { merge: true })
                    dispatch(doTimersDelete(bill_order_id))
                }
                else {
                    // ... rewrite the timer appropriately or assume updated appropriately?
                    // I think it is safest to not rewrite timer, else risks infinite loop
                }
            })
        }
        catch (error) {
            console.log('actionsTimers doTimerComplete error: ', error)
            if (attempt < 3) dispatch(doTimerComplete(bill_order_id, attempt + 1))
            else dispatch(doAlertAdd('Failed to submit a bill order', error.message || error.code || `Please check in with table ${getState().tables[table_id]?.name} and let us know if you see this error multiple times`))
        }
    }
}