/* eslint-disable no-await-in-loop */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { createBillItem } = require('./helpers/billItemTemplate');
const { getSnapshotData, reportErrors } = require('./helpers/callableFns');

/**
 * Getter for BillGroups in this order
 * Returns array of BillGroup documents
 * 
 * @param {Object} transaction Existing transaction
 * @param {Object} billRef Reference for the bill
 * @param {Array} bill_group_ids IDs for bill groups
 */
const getBillGroups = async (transaction, billRef, bill_group_ids) => {
    return (await Promise.all(bill_group_ids.map(id => transaction.get(billRef.collection('BillGroups').doc(id)))))
        .map(groupDoc => groupDoc.data())
}

/**
 * Getter for restaurant Items in this order
 * Returns object of Item documents
 * 
 * @param {Object} transaction Existing transaction
 * @param {Object} restaurantRef Reference for the restaurant
 * @param {Array} billGroups Bill Groups from getBillGroups
 */
const getItems = async (transaction, restaurantRef, billGroups) => {
    const items = {}

    billGroups.forEach(billGroup => items[billGroup.reference_ids.item_id] = true)

    return (await Promise.all(Object.keys(items).map(item_id => transaction.get(restaurantRef.collection('Items').doc(item_id)))))
        .reduce((acc, itemDoc) => ({ ...acc, [itemDoc.id]: itemDoc.data() }), {})
}

const isValidBillGroup = (billGroup, item) => {
    /*
        MALICIOUS errors
        vs
        RESTAURANT LIVE EDIT ERRORS
    */

    return true
}

/**
 * Convert all requested BillGroups into BillItems (thereby ordering them)
 * 
 * @param {String} restaurant_id ID of the restaurant
 * @param {String} bill_id ID of the bill
 * @param {String} expected_bill_order_id Requested ID of the bill order
 * @param {Array} asap_bill_group_ids (optional) Requested BillGroups for ASAP
 * @param {String} asap_user_id (optional) ID of user requesting asap_bill_group_ids
 * @param {Boolean} is_pos_completed Whether the POS initiated this call (standard when timer runs out)
 */
const itemize = (restaurant_id, bill_id, expected_bill_order_id, asap_bill_group_ids, asap_user_id, is_pos_completed = false) => {
    const restaurantRef = admin.firestore().collection('Restaurants').doc(restaurant_id)
    const billRef = restaurantRef.collection('Bills').doc(bill_id)
    const orderCountRef = restaurantRef.collection('Counts').doc('OrderCount')

    return admin.firestore().runTransaction(async transaction => {
        const {
            order_status: { bill_order_id, },
            analytics_helper: { day_id },
            user_status,
            is_test = false,
            timestamps,
            is_order_enabled
        } = await getSnapshotData(billRef, transaction)

        if (timestamps.closed) throw new functions.https.HttpsError('failed-precondition', `This bill is closed. Please speak to a server if you would like the bill re-opened.`)
        if (!is_order_enabled) throw new functions.https.HttpsError('failed-precondition', `Ordering was deactivated for this bill. Please speak to a server if you like to order through Torte`)
        if (bill_order_id !== expected_bill_order_id) throw new functions.https.HttpsError('failed-precondition', 'Requested order does not appear to be valid.')

        const billOrderRef = billRef.collection('BillOrders').doc(bill_order_id)

        const { tax_rates, is_order_enabled: isOrderEnabled } = await getSnapshotData(restaurantRef, transaction)
        // ??? restaurant status closed
        if (!isOrderEnabled) throw new functions.https.HttpsError('failed-precondition', 'This restaurant is not currently taking orders through Torte')

        const billOrder = await getSnapshotData(billOrderRef, transaction)
        // ??? bill order is too young or lacks users

        if (billOrder.timestamps.completed) {
            await billRef.set({
                order_status: {
                    bill_order_id: '',
                }
            }, { merge: true })
            return null
            // throw new functions.https.HttpsError('failed-precondition', 'This order was already submitted')
        }

        if (asap_bill_group_ids) {
            if (asap_bill_group_ids.some(bill_group_id => !billOrder.bill_groups_by_user[asap_user_id].includes(bill_group_id))) {
                throw new functions.https.HttpsError('permission-denied', 'You do not have permission to request these groups.')
            }
        }

        const { [is_test ? 'order_count_test' : 'order_count']: order_count } = await getSnapshotData(orderCountRef, transaction)

        const billGroups = await getBillGroups(transaction, billRef, asap_bill_group_ids || billOrder.bill_group_ids)
        const items = await getItems(transaction, restaurantRef, billGroups)

        let bill_item_ids = []
        let users = {}

        billGroups.forEach(billGroup => {
            const {
                reference_ids: { item_id, variant_id },
                summary: { subtotal },
                quantity
            } = billGroup

            const item = { ...items[item_id], ...items[item_id].variants[variant_id] }
            const tax_rate = { id: item.tax_rate_id, ...tax_rates[item.tax_rate_id] }
            const tax = Math.round(subtotal * tax_rate.percent / 100)

            // isValidBillGroup(billGroup, item)

            let billItem = createBillItem(
                billGroup,
                subtotal,
                tax,
                tax_rate,
                bill_order_id,
                item.printer_id
            )
            billItem.timestamps.created = admin.firestore.FieldValue.serverTimestamp()

            let groupItemIDs = []
            for (let i = 0; i < billGroup.quantity; i++) {
                const billItemRef = billRef.collection('BillItems').doc()
                groupItemIDs.push(billItemRef.id)
                bill_item_ids.push(billItemRef.id)
                transaction.set(billItemRef, {
                    ...billItem,
                    id: billItemRef.id,
                })

                // Keeping all fields out of laziness... should trim off units at least
                transaction.set(billRef.collection('BillItemAnalytics').doc(billItemRef.id), {
                    ...billItem,
                    id: billItemRef.id,
                })
            }

            transaction.set(billRef, {
                bill_item_status: {
                    ordered: admin.firestore.FieldValue.arrayUnion(...groupItemIDs),
                },
                user_status: { [billGroup.user_id]: { order_total: admin.firestore.FieldValue.increment(quantity * (subtotal + tax)) } },
                order_summary: {
                    subtotal: admin.firestore.FieldValue.increment(quantity * subtotal),
                    tax: admin.firestore.FieldValue.increment(quantity * tax),
                    total: admin.firestore.FieldValue.increment(quantity * (subtotal + tax)),
                },
                orders: {
                    user: {
                        subtotal: admin.firestore.FieldValue.increment(quantity * subtotal),
                        tax: admin.firestore.FieldValue.increment(quantity * tax),
                        total: admin.firestore.FieldValue.increment(quantity * (subtotal + tax)),
                    }
                },
            }, { merge: true })

            transaction.set(billRef.collection('BillUsers').doc(billGroup.user_id), {
                order_summary: {
                    subtotal: admin.firestore.FieldValue.increment(quantity * subtotal),
                    tax: admin.firestore.FieldValue.increment(quantity * tax),
                    total: admin.firestore.FieldValue.increment(quantity * (subtotal + tax)),
                    bill_group_ids: admin.firestore.FieldValue.arrayUnion(billGroup.id),
                    // bill_item_ids??
                }
            }, { merge: true })

            transaction.set(billRef.collection('BillGroups').doc(billGroup.id), {
                bill_item_ids: groupItemIDs,
                timestamps: {
                    itemized: admin.firestore.FieldValue.serverTimestamp()
                }
            }, { merge: true })

            users[billGroup.user_id] = true
        })

        transaction.set(orderCountRef, {
            [is_test ? 'order_count_test' : 'order_count']: admin.firestore.FieldValue.increment(1) //order_count + 1
        }, { merge: true })

        if (asap_bill_group_ids) {
            const remaining_for_user = billOrder.bill_groups_by_user[asap_user_id].filter(id => !asap_bill_group_ids.includes(id))

            // Unlikely, but complete take over the billOrder
            if (!remaining_for_user.length && billOrder.user_ids.length === 1) {
                transaction.set(billOrderRef, {
                    bill_item_ids,
                    timestamps: {
                        completed: admin.firestore.FieldValue.serverTimestamp()
                    },
                    order_count: order_count + 1,
                    is_pos_completed,
                }, { merge: true })

                transaction.set(billRef, {
                    order_status: {
                        bill_order_id: '',
                        user_ids: [],
                    },
                }, { merge: true })
            }
            else {
                if (remaining_for_user.length) {
                    transaction.set(billOrderRef, {
                        bill_groups_by_user: {
                            [asap_user_id]: remaining_for_user,
                        },
                        bill_group_ids: admin.firestore.FieldValue.arrayRemove(...asap_bill_group_ids),
                    }, { merge: true })
                }
                else {
                    transaction.set(billOrderRef, {
                        bill_groups_by_user: {
                            [asap_user_id]: admin.firestore.FieldValue.delete()
                        },
                        user_ids: admin.firestore.FieldValue.arrayRemove(asap_user_id),
                        ...billOrder.paused_user_id === asap_user_id && { paused_user_id: '' }
                    }, { merge: true })

                    transaction.set(billRef, {
                        order_status: {
                            user_ids: admin.firestore.FieldValue.arrayRemove(asap_user_id),
                        },
                    }, { merge: true })
                }

                const newBillOrderRef = billRef.collection('BillOrders').doc()
                transaction.set(newBillOrderRef, {
                    bill_item_ids,
                    bill_group_ids: asap_bill_group_ids,
                    bill_groups_by_user: { [asap_user_id]: asap_bill_group_ids },
                    bill_id: billRef.id,
                    force_user_id: '',
                    id: newBillOrderRef.id,
                    order_count: order_count + 1,
                    paused_user_id: '',
                    restaurant_id: restaurantRef.id,
                    is_pos_completed,
                    timestamps: {
                        completed: admin.firestore.FieldValue.serverTimestamp(),
                        created: admin.firestore.FieldValue.serverTimestamp(),
                        last_activity: admin.firestore.FieldValue.serverTimestamp(),
                        ready: admin.firestore.FieldValue.serverTimestamp(),
                    },
                    user_ids: [asap_user_id],
                    wait_user_ids: [],
                }, { merge: true })
            }
        }
        else {
            transaction.set(billOrderRef, {
                bill_item_ids,
                timestamps: {
                    completed: admin.firestore.FieldValue.serverTimestamp()
                },
                order_count: order_count + 1,
                is_pos_completed,
            }, { merge: true })

            transaction.set(billRef, {
                order_status: {
                    bill_order_id: '',
                    user_ids: [],
                },
            }, { merge: true })
        }

        const dayRef = restaurantRef.collection('Days').doc(day_id)
        transaction.set(dayRef, {
            orders: {
                user: {
                    quantity: admin.firestore.FieldValue.increment(1),
                    ...Boolean(asap_bill_group_ids) && { quantity_asap: admin.firestore.FieldValue.increment(1), },
                },
            },
            usage: {
                devices: {
                    ordered: admin.firestore.FieldValue.increment(Object.keys(users).filter(uid => !user_status[uid] || !user_status[uid].order_total).length)
                }
            }
        }, { merge: true })
    }).catch(reportErrors('order2', asap_user_id ? 'itemizeASAP' : 'itemize'))
}

/**
 * Call to finalize the entire BillOrder
 * 
 * @param {String} restaurant_id ID of the restaurant
 * @param {String} bill_id ID of the bill
 * @param {String} expected_bill_order_id Requested ID of the bill order
 * @param {Boolean} is_pos_completed Whether the POS initiated this call (standard when timer runs out)
 */
exports.itemize = functions.https.onCall(async (data, context) => {
    // Restrict to restaurant?

    const { restaurant_id, bill_id, bill_order_id, is_pos_completed } = data

    // You can confirm the requesting user is a server ehre
    return itemize(restaurant_id, bill_id, bill_order_id, undefined, undefined, is_pos_completed)
})

/**
 * Call to finalize only part of a BillOrder
 * 
 * @param {String} restaurant_id ID of the restaurant
 * @param {String} bill_id ID of the bill
 * @param {String} bill_order_id Requested ID of the bill order
 * @param {Array} asap_bill_group_ids (optional) Requested BillGroups for ASAP
 * @param {String} asap_user_id (optional) ID of user requesting asap_bill_group_ids
 */
exports.itemizeASAP = functions.https.onCall(async (data, context) => {
    const { restaurant_id, bill_id, bill_order_id, asap_bill_group_ids } = data

    const user_id = context.auth.uid

    return itemize(restaurant_id, bill_id, bill_order_id, asap_bill_group_ids, user_id)
})