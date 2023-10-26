/* eslint-disable no-await-in-loop */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { dateToString } = require('./helpers/functions');
const { getSnapshotData, reportErrors } = require('./helpers/callableFns');

/**
 * Allows removal of open_bill alerts server-side when bill is closed
 *
 * @param {Object} transaction Existing transaction object
 * @param {Object} bill Bill document
 */
const removeBillFromUserOpenBills = (transaction, bill) => {
    const { user_ids, restaurant, timestamps, id: bill_id } = bill

    user_ids.forEach(user_id => {
        transaction.set(admin.firestore().collection('UsersPOS').doc(user_id), {
            torte: {
                open_bills: admin.firestore.FieldValue.arrayRemove({
                    bill_id,
                    restaurant,
                    date: dateToString(timestamps.created.toDate())
                })
            }
        }, { merge: true })
    })
}

/**
 * Direct call to removeBillFromUserOpenBills
 *
 * @param {Object} bill_id ID of bill
 */
exports.deleteOpenBillAlerts = functions.https.onCall(async (data, context) => {
    const restaurant_id = context.auth && context.auth.uid;

    if (!restaurant_id) {
        console.error('Unauthenticated attempt to delete open bill alerts')
        return null
    }

    const {
        bill_id
    } = data

    const billRef = admin.firestore().collection('Restaurants').doc(restaurant_id).collection('Bills').doc(bill_id)

    return admin.firestore().runTransaction(async transaction => {
        const bill = await getSnapshotData(billRef, transaction)

        removeBillFromUserOpenBills(transaction, bill)
    })
        .catch(error => {
            console.error(error)
            // Silence any errors from this function (do not return to user)
        })
})

/**
 * Close a bill
 *
 * @param {Object} bill_id ID of bill
 */
exports.markBillClosed = functions.https.onCall(async (data, context) => {
    const restaurant_id = context.auth && context.auth.uid;

    if (!restaurant_id) throw new functions.https.HttpsError("permission-denied", "Cannot determine restaurant, make sure you are logged in.");

    const {
        bill_id
    } = data

    const restaurantRef = admin.firestore().collection('Restaurants').doc(restaurant_id)
    const billRef = restaurantRef.collection('Bills').doc(bill_id)

    return admin.firestore().runTransaction(async transaction => {
        const bill = await getSnapshotData(billRef, transaction)

        const {
            order_summary,
            paid_summary,
            bill_item_status: { paid, claimed, ordered, voided, deleted },
            analytics_helper: { day_id },
            party: { party_size = 0 },
            user_ids,
        } = bill;

        if (order_summary.total > paid_summary.total) return { unpaid: true }

        transaction.set(billRef, {
            timestamps: {
                closed: admin.firestore.FieldValue.serverTimestamp(),
                unpaid: null,
            }
        }, { merge: true });

        // Mark BillItems as closed
        [...paid, ...claimed, ...ordered, ...voided, ...deleted].forEach(bill_item_id => {
            transaction.set(billRef.collection('BillItems').doc(bill_item_id), {
                timestamps: { closed: admin.firestore.FieldValue.serverTimestamp(), }
            }, { merge: true })
        })

        // Delete any bills that lack items from analytics
        if (!ordered.length && !claimed.length && !paid.length && !voided.length) {
            transaction.set(restaurantRef.collection('Days').doc(day_id), {
                bill_ids: admin.firestore.FieldValue.arrayRemove(bill_id),
                usage: {
                    devices: {
                        joined: admin.firestore.FieldValue.increment(-user_ids.length)
                    },
                    tables: admin.firestore.FieldValue.increment(-1),
                    diners: admin.firestore.FieldValue.increment(-party_size)
                },
            }, { merge: true })
        }

        removeBillFromUserOpenBills(transaction, bill)
    }).catch(reportErrors('close', 'markBillClosed'))
})

/**
 * Reopen a closed bill
 *
 * @param {Object} bill_id ID of bill
 */
exports.markBillOpen = functions.https.onCall(async (data, context) => {
    const restaurant_id = context.auth && context.auth.uid;

    if (!restaurant_id) throw new functions.https.HttpsError("permission-denied", "Cannot determine restaurant, make sure you are logged in.");

    const {
        bill_id,
    } = data

    const billRef = admin.firestore().collection('Restaurants').doc(restaurant_id).collection('Bills').doc(bill_id)

    return admin.firestore().runTransaction(async transaction => {
        const bill = await getSnapshotData(billRef, transaction)

        const {
            bill_item_status: { paid, claimed, ordered, voided, deleted },
            timestamps
        } = bill;

        if (!timestamps.closed) {
            if (timestamps.unpaid) {
                transaction.set(billRef, {
                    timestamps: {
                        charged: null,
                        unpaid: null,
                    }
                }, { merge: true })
            }
            return
        }

        transaction.set(billRef, {
            timestamps: {
                charged: null,
                closed: null,
                unpaid: null,
            }
        }, { merge: true });

        // Reopen BillItems
        [...paid, ...claimed, ...ordered, ...voided, ...deleted].forEach(bill_item_id => {
            transaction.set(billRef.collection('BillItems').doc(bill_item_id), {
                timestamps: {
                    closed: null,
                },
            }, { merge: true })
        })
    }).catch(reportErrors('close', 'markBillOpen'))
})

exports.markBillUnpaid = functions.https.onCall(async (data, context) => {
    const restaurant_id = context.auth && context.auth.uid;

    if (!restaurant_id) throw new functions.https.HttpsError("permission-denied", "Cannot determine restaurant, make sure you are logged in.");

    const {
        bill_id
    } = data

    const billRef = admin.firestore().collection('Restaurants').doc(restaurant_id).collection('Bills').doc(bill_id)

    return admin.firestore().runTransaction(async transaction => {
        const bill = await getSnapshotData(billRef, transaction)

        const {
            order_summary,
            paid_summary,
        } = bill;

        if (order_summary.total <= paid_summary.total) return null

        transaction.set(billRef, {
            timestamps: {
                unpaid: admin.firestore.FieldValue.serverTimestamp(),
            }
        }, { merge: true })
    }).catch(reportErrors('close', 'markBillUnpaid'))
})