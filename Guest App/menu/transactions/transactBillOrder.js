import firestore from '@react-native-firebase/firestore'
import auth from '@react-native-firebase/auth'
import calculateTimeRemaining from "../../utils/functions/calculateTimeRemaining"

const PAUSE_2_MINUTES = 120000


/*

MANTRA: Always push the order forward, but give users an opportunity to delay

READY occurs whenever there is no WAIT or PAUSE on the bill, or the order is FORCED

WAIT: A request from users OUTSIDE the order that pauses the order
    Response to an alert that is fired whenever the order is READY
    Shorter inactivity time allowed (2min)
    Unwaiting will auto-start the order if no other wait or pause

PAUSE: A request from a single user INSIDE the order that pauses the order
    This user is taking control over the order path
    Longer inactivity time allowed (5min)
    Unpausing will auto-start the order if !wait

FORCE: A request from a user INSIDE the order to ignore WAITS and PAUSES
    This user must respond to an ALERT
    This DOES NOT clear / invalidate the current WAIT / PAUSE list

CANCEL: A user removes themself from the order
    The user will automatically receive a WAIT request the next time the order is READY

ASAP: A user sends their own items off separate from the order
    The user must repond to an ALERT
    Alters the SectionList to allow selection... maybe just nest each BillGroup is easiest

READY NOTIFICATIONS: WAIT / PAUSE opportunity for any user on bill
*/


export const transactSubmitBillOrder = (restaurant_id, bill_id, bill_group_ids) => {
    const myID = auth().currentUser.uid

    const billRef = firestore().collection('Restaurants').doc(restaurant_id)
        .collection('Bills').doc(bill_id)

    return firestore().runTransaction(async transaction => {
        const { cart_status: { bill_group_ids: allBillGroupIDs }, order_status: { bill_order_id }, table: { id: table_id }, user_ids: allUserIDs } = (await transaction.get(billRef)).data()

        if (!bill_group_ids.every(bill_group_id => allBillGroupIDs.includes(bill_group_id))) throw 'Please try again'

        let isAutoPaused // !equalArrays(bill_group_ids, cartBillGroupIDs) for cart-only

        if (bill_order_id) {
            const { timestamps: { ready, auto_paused }, paused_user_id, wait_user_ids, user_ids } = (await transaction.get(billRef.collection('BillOrders').doc(bill_order_id))).data()

            const timeToUnpause = calculateTimeRemaining(auto_paused, PAUSE_2_MINUTES)

            // isAutoPause 
            const startCountdown = (() => {
                // Continue (refresh) countdown if already running
                if (ready) return true
                // Maintain pause
                if (paused_user_id) return false
                // Maintain wait list
                if (wait_user_ids.filter(id => id !== myID).length) return false
                // Every user is now on this bill
                if (allUserIDs.every(user_id => user_id === myID || user_ids.includes(user_id))) return true
                // Do not autostart if autopause is in effect
                // if (timeToUnpause) {
                //     // only report the autopause if there is >7 seconds remaining
                //     if (timeToUnpause > 7000) isAutoPaused = true
                //     return false
                // }
                return true
            })()

            transaction.set(billRef.collection('BillOrders').doc(bill_order_id), {
                bill_group_ids: firestore.FieldValue.arrayUnion(...bill_group_ids),
                user_ids: firestore.FieldValue.arrayUnion(myID),
                bill_groups_by_user: { [myID]: bill_group_ids },

                wait_user_ids: firestore.FieldValue.arrayRemove(myID),

                is_pos_readied: false,

                ...startCountdown && {
                    timestamps: {
                        ready: firestore.FieldValue.serverTimestamp(),
                    }
                }
            }, { merge: true })

            transaction.set(billRef,
                {
                    cart_status: {
                        bill_group_ids: firestore.FieldValue.arrayRemove(...bill_group_ids),
                    },
                    order_status: {
                        user_ids: firestore.FieldValue.arrayUnion(myID)
                    },
                }, { merge: true })
        }
        else {
            isAutoPaused = allUserIDs.length > 1

            const orderRef = billRef.collection('BillOrders').doc()

            transaction.set(orderRef, {
                id: orderRef.id,
                order_number: null,
                restaurant_id,
                bill_id,
                table_id,

                bill_group_ids: firestore.FieldValue.arrayUnion(...bill_group_ids),
                user_ids: [myID],
                bill_groups_by_user: { [myID]: bill_group_ids },

                force_user_id: '',
                paused_user_id: '',
                wait_user_ids: [],

                is_pos_readied: false,
                is_pos_completed: false,

                timestamps: {
                    created: firestore.FieldValue.serverTimestamp(),
                    ready: firestore.FieldValue.serverTimestamp(),
                    // ready: isAutoPaused ? null : firestore.FieldValue.serverTimestamp(),
                    completed: null,
                    last_activity: null, //firestore.FieldValue.serverTimestamp(),
                    // ...isAutoPaused && { auto_paused: firestore.FieldValue.serverTimestamp() },
                }
            }, { merge: true })

            transaction.set(billRef,
                {
                    cart_status: {
                        bill_group_ids: firestore.FieldValue.arrayRemove(...bill_group_ids),
                    },
                    order_status: {
                        bill_order_id: orderRef.id,
                        user_ids: [myID],
                    }
                }, { merge: true })
        }

        bill_group_ids.forEach(id => transaction.set(billRef.collection('BillGroups').doc(id), {
            timestamps: {
                ordered: firestore.FieldValue.serverTimestamp(),
            },
        },
            { merge: true }
        ))

        return isAutoPaused
    })
}

export const transactCancelBillOrder = (restaurant_id, bill_id,) => {
    const myID = auth().currentUser.uid

    const billRef = firestore().collection('Restaurants').doc(restaurant_id)
        .collection('Bills').doc(bill_id)

    return firestore().runTransaction(async transaction => {
        const { order_status: { bill_order_id }, } = (await transaction.get(billRef)).data()

        const billOrderRef = billRef.collection('BillOrders').doc(bill_order_id)
        const { bill_groups_by_user, timestamps: { completed, }, paused_user_id, force_user_id, user_ids } = (await transaction.get(billOrderRef)).data()

        if (completed || !bill_groups_by_user[myID]?.length) {
            // Either user is not on the order or the order was already completed
            throw 'No order to cancel'
        }

        const remainingUsers = user_ids.filter(user_id => user_id !== myID)

        if (!remainingUsers.length) {
            transaction.delete(billOrderRef)
            transaction.set(billRef, {
                cart_status: { bill_group_ids: firestore.FieldValue.arrayUnion(...bill_groups_by_user[myID]), },
                order_status: {
                    user_ids: [],
                    bill_order_id: '',
                },
            }, { merge: true })
        }
        else {
            transaction.set(billOrderRef, {
                bill_group_ids: firestore.FieldValue.arrayRemove(...bill_groups_by_user[myID]),
                user_ids: firestore.FieldValue.arrayRemove(myID),
                bill_groups_by_user: { [myID]: firestore.FieldValue.delete() },

                ...(paused_user_id === myID) && { paused_user_id: '' },
                ...force_user_id === myID && { force_user_id: '' },
                wait_user_ids: remainingUsers.length ? firestore.FieldValue.arrayUnion(myID) : [],
                is_pos_readied: false,
                timestamps: {
                    ready: null,
                    last_activity: firestore.FieldValue.serverTimestamp(),
                    ...!remainingUsers.length && { auto_paused: null }
                }
            }, { merge: true })

            transaction.set(billRef, {
                cart_status: { bill_group_ids: firestore.FieldValue.arrayUnion(...bill_groups_by_user[myID]), },
                order_status: {
                    user_ids: firestore.FieldValue.arrayRemove(myID)
                },
            }, { merge: true })
        }

        bill_groups_by_user[myID].forEach(id => transaction.set(billRef.collection('BillGroups').doc(id), {
            timestamps: {
                ordered: null,
            },
        },
            { merge: true }
        ))

        return !!remainingUsers.length
    })
}

export const transactWaitBillOrderToggle = (restaurant_id, bill_id, isRequestingWait) => {
    const myID = auth().currentUser.uid


    const billRef = firestore().collection('Restaurants').doc(restaurant_id)
        .collection('Bills').doc(bill_id)

    return firestore().runTransaction(async transaction => {
        const { order_status: { bill_order_id }, } = (await transaction.get(billRef)).data()

        const billOrderRef = billRef.collection('BillOrders').doc(bill_order_id)

        const { timestamps: { completed, auto_paused, ready }, paused_user_id, force_user_id, wait_user_ids, user_ids } = (await transaction.get(billOrderRef)).data()

        if (completed || user_ids.includes(myID)) { //  
            // Either user is not on the order or the order was already completed
            throw 'Cannot request wait'
        }

        if (isRequestingWait) {
            transaction.set(billOrderRef, {
                force_user_id: '',
                wait_user_ids: firestore.FieldValue.arrayUnion(myID),
                is_pos_readied: false,
                timestamps: {
                    ready: null,
                    last_activity: firestore.FieldValue.serverTimestamp(),
                }
            }, { merge: true })
        }
        else {
            const startCountdown = (() => {
                if (ready) return true
                if (paused_user_id) return false
                if (wait_user_ids.filter(id => id !== myID).length) return false
                return !!user_ids.length && calculateTimeRemaining(auto_paused, PAUSE_2_MINUTES) <= 0
            })()

            transaction.set(billOrderRef, {
                wait_user_ids: firestore.FieldValue.arrayRemove(myID),
                is_pos_readied: false,
                ...startCountdown && {
                    timestamps: {
                        ready: firestore.FieldValue.serverTimestamp(),
                    }
                }
            }, { merge: true })
        }
    })

}



export const transactPauseBillOrderToggle = (restaurant_id, bill_id, isRequestingPause) => {
    const myID = auth().currentUser.uid

    const billRef = firestore().collection('Restaurants').doc(restaurant_id)
        .collection('Bills').doc(bill_id)

    return firestore().runTransaction(async transaction => {
        const { order_status: { bill_order_id }, } = (await transaction.get(billRef)).data()

        const billOrderRef = billRef.collection('BillOrders').doc(bill_order_id)

        const { timestamps: { completed, ready, auto_paused }, paused_user_id, wait_user_ids, force_user_id, user_ids } = (await transaction.get(billOrderRef)).data()


        if (completed || !user_ids.includes(myID)) { //  
            // Either user is not on the order or the order was already completed
            throw 'Cannot pause order'
        }
        if (isRequestingPause && paused_user_id && !force_user_id) {
            throw 'Cannot pause order'
        }
        if (!isRequestingPause && paused_user_id !== myID) {
            throw 'Cannot unpause order'
        }


        if (isRequestingPause) {
            transaction.set(billOrderRef, {
                force_user_id: '',
                paused_user_id: myID,
                is_pos_readied: false,
                timestamps: {
                    ready: null,
                }
            }, { merge: true })
        }
        else {
            const startCountdown = (() => {
                if (ready) return true
                if (wait_user_ids.length) return false
                return calculateTimeRemaining(auto_paused, PAUSE_2_MINUTES) <= 0
            })()

            transaction.set(billOrderRef, {
                paused_user_id: '',
                is_pos_readied: false,
                ...startCountdown && {
                    timestamps: {
                        ready: firestore.FieldValue.serverTimestamp(),
                    }
                }
            }, { merge: true })
        }
    })
}

export const transactForceBillOrder = (restaurant_id, bill_id) => {
    const myID = auth().currentUser.uid

    const billRef = firestore().collection('Restaurants').doc(restaurant_id)
        .collection('Bills').doc(bill_id)

    return firestore().runTransaction(async transaction => {
        const { order_status: { bill_order_id }, } = (await transaction.get(billRef)).data()

        const billOrderRef = billRef.collection('BillOrders').doc(bill_order_id)

        const { timestamps: { completed, }, user_ids } = (await transaction.get(billOrderRef)).data()

        if (completed || !user_ids.includes(myID)) { //  
            // Either user is not on the order or the order was already completed
            throw 'Cannot force order'
        }

        transaction.set(billOrderRef, {
            force_user_id: myID,
            pause_user_id: '',
            wait_user_ids: [],
            is_pos_readied: false,
            timestamps: {
                ready: firestore.FieldValue.serverTimestamp(),
            }
        }, { merge: true })
    })
}

