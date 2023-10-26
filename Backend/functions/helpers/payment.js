/*
* paymentBill: Save the payment information into all bill (and restaurant) documents
* paymentAnalyltics: Save the payment information to all Day documents
*
* Stripe payments are only saved after webhook returns success
* Free meals and POS inputs are saved directly
*/


/* eslint-disable no-implicit-coercion */
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getSnapshotData } = require('./triggerFns');

/**
 * Getter for a field within an object
 *
 * @param {Object} obj A document object
 * @param {String} fields Field(s) to extract
 */
const deltaFieldRecursion = (obj, ...fields) => {
    const next = fields.shift()
    if (!obj[next]) return 0
    if (!fields.length) return obj[next]
    return deltaFieldRecursion(obj[next], ...fields)
}

/**
 * Value after - value before
 *
 * @param {Object} before BillPayment object BEFORE
 * @param {Object} after BillPayment object AFTER
 * @param {String} fields Field(s) collect value
 */
const getDelta = (before, after, ...fields) => {
    return deltaFieldRecursion(after, ...fields) - deltaFieldRecursion(before, ...fields)
}

/**
 * After completion of a payment
 * Save payment information across bill documents
 *
 * ??? REWRITE more granularly?
 * 
 * BillPayment object reported before and after in case of events such as Cash payment deleted
 * @param {Object} before BillPayment object BEFORE
 * @param {Object} after BillPayment object AFTER
 * @param {String} restaurant_id ID of restaurant (???technically accessible through BillPayment)
 * @param {String} bill_id ID of bill (???technically accessible through BillPayment)
 * @param {String} bill_payment_id ID of (???technically accessible through BillPayment)
 * @param {String} user_id ID of table (???technically accessible through BillPayment)
 */
exports.paymentBill = (before, after, restaurant_id, bill_id, bill_payment_id, user_id,) => {
    const restaurantRef = admin.firestore().collection('Restaurants').doc(restaurant_id)
    const paymentCountRef = restaurantRef.collection('Counts').doc('PaymentCount')

    const billRef = restaurantRef.collection('Bills').doc(bill_id)
    const billItemsRef = billRef.collection('BillItems')
    const billPaymentRef = billRef.collection('BillPayments').doc(bill_payment_id)

    const usersCollection = admin.firestore().collection('UsersPOS')


    return admin.firestore().runTransaction(async transaction => {
        /*
        * Get bill payment after webhook success
        */
        if (!after) {
            after = await getSnapshotData(billPaymentRef, transaction)
        }

        const {
            type,
            status,
            analytics_helper: {
                bill_item_ids = [],
            },
            payment_intent = null,
            restaurant,
            coupons = [],
        } = after


        if (status !== 'processing') {
            throw new functions.https.HttpsError('failed-precondition', `This payment has already ${status}`)
        }

        /*
        * Get all required documents
        */

        const {
            order_summary: { total: total_ordered },
            paid_summary: { total: total_paid },
            user_status,
            is_test,
        } = await getSnapshotData(billRef, transaction)

        // Default isTest to the payment_intent
        const isTest = payment_intent ? !payment_intent.livemode : is_test

        const {
            [isTest ? 'payment_count_test' : 'payment_count']: payment_count
        } = await getSnapshotData(paymentCountRef, transaction)

        const billItemSnapshots = await Promise.all(bill_item_ids.filter(bill_item_id => bill_item_id !== 'correction').map(bill_item_id => transaction.get(billItemsRef.doc(bill_item_id))))

        /*
        * Calculate shared variables
        */
        const chargeRemaining = total_ordered - total_paid
        const deltaSubtotal = getDelta(before, after, 'summary', 'subtotal')
        const deltaTax = getDelta(before, after, 'summary', 'tax')
        const deltaDiscounts = getDelta(before, after, 'summary', 'discounts')
        const deltaTotal = getDelta(before, after, 'summary', 'total')
        const deltaTip = getDelta(before, after, 'summary', 'tip')
        const deltaFinal = getDelta(before, after, 'summary', 'final')
        const deltaUnremitted = getDelta(before, after, 'summary', 'unremitted')
        const deltaFee = getDelta(before, after, 'summary', 'fee')
        const deltaFree = !after.summary.final - (before.id && !before.summary.final)

        const paid_summary = {
            subtotal: admin.firestore.FieldValue.increment(deltaSubtotal),
            tax: admin.firestore.FieldValue.increment(deltaTax),
            tips: admin.firestore.FieldValue.increment(deltaTip),
            unremitted: admin.firestore.FieldValue.increment(deltaUnremitted),
            discounts: admin.firestore.FieldValue.increment(deltaDiscounts),
            total: admin.firestore.FieldValue.increment(deltaTotal),
            final: admin.firestore.FieldValue.increment(deltaFinal),
            fees: admin.firestore.FieldValue.increment(deltaFee),
        }

        let payments = {}
        switch (type) {
            case 'app':
                payments = {
                    [type]: {
                        subtotal: admin.firestore.FieldValue.increment(deltaSubtotal),
                        tax: admin.firestore.FieldValue.increment(deltaTax),
                        tips: admin.firestore.FieldValue.increment(deltaTip),
                        unremitted: admin.firestore.FieldValue.increment(deltaUnremitted),
                        quantity: admin.firestore.FieldValue.increment(1),
                        free_quantity: admin.firestore.FieldValue.increment(deltaFree),
                    },
                }
                break;
            case 'charge':
                payments = {
                    [type]: {
                        subtotal: admin.firestore.FieldValue.increment(deltaSubtotal),
                        tax: admin.firestore.FieldValue.increment(deltaTax),
                        tips: admin.firestore.FieldValue.increment(deltaTip),
                        fees: admin.firestore.FieldValue.increment(deltaFee),
                        quantity: admin.firestore.FieldValue.increment(1),
                    },
                }
                break;
            case 'cash':
            case 'swipe':
            case 'manual':
            case 'outside':
                payments = {
                    [type]: {
                        total: admin.firestore.FieldValue.increment(deltaTotal),
                        tips: admin.firestore.FieldValue.increment(deltaTip),
                        quantity: admin.firestore.FieldValue.increment(1),
                    },
                }
                break;
        }

        /*
        * Save to restaurant documents
        */

        transaction.set(paymentCountRef, {
            [isTest ? 'payment_count_test' : 'payment_count']: payment_count + 1 // ??? increment?
        }, { merge: true })

        /*
        * Save to bill documents
        */

        transaction.set(billRef, {
            payments,
            paid_summary,
        }, { merge: true })

        transaction.set(billPaymentRef, {
            status: 'succeeded',
            payment_count: payment_count + 1,
        }, { merge: true })

        /*
        * Save to user documents
        */
        if (user_id) {
            const userRef = usersCollection.doc(user_id)
            const couponsRef = userRef.collection('Coupons')
            const billUserRef = billRef.collection('BillUsers').doc(user_id)

            billItemSnapshots.forEach(doc => {
                const {
                    units,
                    id,
                } = doc.data()

                transaction.set(doc.ref, {
                    analytics_helper: {
                        paid_user_ids: admin.firestore.FieldValue.arrayUnion(user_id)
                    },
                }, { merge: true })

                // CANNOT USE ARRAY UNION, identical objects will be reduced
                if (type === 'app') {
                    transaction.set(doc.ref, {
                        units: {
                            paid: { [user_id]: [...(units.claimed[user_id] || []), ...(units.paid[user_id] || []),] },
                            claimed: { [user_id]: admin.firestore.FieldValue.delete() },
                        },
                    }, { merge: true })
                }
                else if (type === 'charge') {
                    transaction.set(doc.ref, {
                        units: {
                            charged: { [user_id]: [...(units.precharged[user_id] || []), ...(units.charged[user_id] || []),] },
                            claimed: { [user_id]: admin.firestore.FieldValue.delete() },
                            precharged: { [user_id]: admin.firestore.FieldValue.delete() },
                        },
                    }, { merge: true })
                }

                const isUnordered = !units.available.length
                const isUnclaimed = !!units.claimed[user_id] && Object.keys(units.claimed).length === 1
                transaction.set(billRef, {
                    bill_item_status: {
                        ...isUnordered && { ordered: admin.firestore.FieldValue.arrayRemove(id) },
                        ...isUnclaimed && { claimed: admin.firestore.FieldValue.arrayRemove(id) },
                        paid: admin.firestore.FieldValue.arrayUnion(id),
                    }
                }, { merge: true })
            })

            // Trusting BillPayment coupon information... for now.
            coupons.forEach(coupon => {
                const { coupon_id, applied, is_torte_issued, tax_appliance } = coupon
                transaction.set(couponsRef.doc(coupon_id), {
                    restaurant,
                    bill_id,
                    restaurant_id,
                    bill_payment_id,
                    applied,
                    timestamps: {
                        used: admin.firestore.FieldValue.serverTimestamp(),
                    },
                }, { merge: true })

                transaction.set(billRef, {
                    analytics_helper: {
                        coupon_ids: admin.firestore.FieldValue.arrayUnion(coupon_id),
                    },
                    coupons: admin.firestore.FieldValue.arrayUnion(coupon),
                    // I mean, technically this is unnecessary due to the presence of the coupons object above
                    discounts: {
                        object: {
                            bill: {
                                quantity: admin.firestore.FieldValue.increment(1),
                                total: admin.firestore.FieldValue.increment(applied)
                            } // skip bill_item
                        },
                        source: {
                            [is_torte_issued ? 'torte' : 'restaurant']: {
                                quantity: admin.firestore.FieldValue.increment(1),
                                total: admin.firestore.FieldValue.increment(applied)
                            },
                        },
                        tax_appliance: {
                            [tax_appliance]: {
                                quantity: admin.firestore.FieldValue.increment(1),
                                total: admin.firestore.FieldValue.increment(applied)
                            },
                        },
                        type: {
                            coupons: {
                                quantity: admin.firestore.FieldValue.increment(1),
                                total: admin.firestore.FieldValue.increment(applied)
                            } // skip loyalty and promotions
                        }
                    },

                }, { merge: true })

                transaction.set(billUserRef, {
                    analytics_helper: {
                        coupon_ids: admin.firestore.FieldValue.arrayUnion(coupon_id),
                    },
                }, { merge: true })
            })

            transaction.set(billRef, {
                pay_status: { claim_all: admin.firestore.FieldValue.arrayRemove(user_id), },
                user_status: {
                    [user_id]: {
                        paid_total: admin.firestore.FieldValue.increment(deltaTotal),
                        number_of_payments: admin.firestore.FieldValue.increment(1),
                    }
                },
            }, { merge: true })

            transaction.set(billUserRef, {
                analytics_helper: {
                    bill_payment_ids: admin.firestore.FieldValue.arrayUnion(bill_payment_id),
                },
                claim_summary: { // ???decrement?
                    bill_item_ids: [],
                    // overage: 0, DO NOT RESET THE OVERAGE!! this is still true!
                    subtotal: 0,
                    tax: 0,
                    total: 0
                },
                payments,
                paid_summary,
            }, { merge: true })

            const restaurantSpendRef = userRef.collection('Spend').doc(restaurant_id)
            transaction.set(restaurantSpendRef, {
                id: restaurantSpendRef.id,
                user_id,
                spend: admin.firestore.FieldValue.increment(deltaSubtotal > 0 ? deltaSubtotal : 0),
                last_activity: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true })

            const torteSpendRef = userRef.collection('Spend').doc('torte')
            transaction.set(torteSpendRef, {
                id: 'torte',
                user_id,
                spend: admin.firestore.FieldValue.increment(deltaSubtotal > 0 ? deltaSubtotal : 0),
                last_activity: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true })

            return { billPayment: after, billItemSnapshots, number_of_payments: user_status[user_id].number_of_payments }
        }

        return {}
    })
}

/**
 * After completion of a payment
 * Record into bill day's analytics
 *
 * BillPayment object reported before and after in case of events such as Cash payment deleted
 * @param {Object} before BillPayment object BEFORE
 * @param {Object} after BillPayment object AFTER
 * @param {Array} billItemSnapshots Snapshots retrieved from paymentBill
 * @param {Number} number_of_payments Number of payments user has made
 * @param {String} user_id ID of user(???technically accessible through BillPayment)
 */
exports.paymentAnalytics = (before, after, billItemSnapshots = [], number_of_payments, user_id) => {
    const type = before.type || after.type
    const restaurant_id = before.restaurant_id || after.restaurant_id
    const day_id = before.analytics_helper.day_id || after.analytics_helper.day_id
    const day_created = before.analytics_helper.day_created || after.analytics_helper.day_created

    // Uneditable payments:
    const {
        coupons = [],
        payment_intent,
    } = after

    const restaurantRef = admin.firestore().collection('Restaurants').doc(restaurant_id)

    /*
    * Calculate shared variables
    */
    const isFirstPayment = number_of_payments === 1
    const deltaSubtotal = getDelta(before, after, 'summary', 'subtotal')
    const deltaTax = getDelta(before, after, 'summary', 'tax')
    const deltaDiscounts = getDelta(before, after, 'summary', 'discounts')
    const deltaTotal = getDelta(before, after, 'summary', 'total')
    const deltaTip = getDelta(before, after, 'summary', 'tip')
    const deltaFinal = getDelta(before, after, 'summary', 'final')
    const deltaUnremitted = getDelta(before, after, 'summary', 'unremitted')
    const deltaFee = getDelta(before, after, 'summary', 'fee')
    const deltaFree = !after.summary.final - (before.id && !before.summary.final)

    const paid_summary = {
        subtotal: admin.firestore.FieldValue.increment(deltaSubtotal),
        tax: admin.firestore.FieldValue.increment(deltaTax),
        tips: admin.firestore.FieldValue.increment(deltaTip),
        unremitted: admin.firestore.FieldValue.increment(deltaUnremitted),
        discounts: admin.firestore.FieldValue.increment(deltaDiscounts),
        total: admin.firestore.FieldValue.increment(deltaTotal),
        final: admin.firestore.FieldValue.increment(deltaFinal),
        fees: admin.firestore.FieldValue.increment(deltaFee),
    }

    let payments = {}
    switch (type) {
        case 'app':
            payments = {
                [type]: {
                    subtotal: admin.firestore.FieldValue.increment(deltaSubtotal),
                    tax: admin.firestore.FieldValue.increment(deltaTax),
                    tips: admin.firestore.FieldValue.increment(deltaTip),
                    unremitted: admin.firestore.FieldValue.increment(deltaUnremitted),
                    quantity: admin.firestore.FieldValue.increment(1),
                    free_quantity: admin.firestore.FieldValue.increment(deltaFree),
                },
            }
            break;
        case 'charge':
            payments = {
                [type]: {
                    subtotal: admin.firestore.FieldValue.increment(deltaSubtotal),
                    tax: admin.firestore.FieldValue.increment(deltaTax),
                    tips: admin.firestore.FieldValue.increment(deltaTip),
                    fees: admin.firestore.FieldValue.increment(deltaFee),
                    quantity: admin.firestore.FieldValue.increment(1),
                },
            }
            break;
        case 'cash':
        case 'swipe':
        case 'manual':
        case 'outside':
            payments = {
                [type]: {
                    total: admin.firestore.FieldValue.increment(deltaTotal),
                    tips: admin.firestore.FieldValue.increment(deltaTip),
                    quantity: admin.firestore.FieldValue.increment(1),
                },
            }
            break;
    }

    const batch = admin.firestore().batch()


    const dayRef = restaurantRef.collection('Days').doc(day_id)
    batch.set(dayRef, {
        ...isFirstPayment && {
            usage: {
                devices: { paid: admin.firestore.FieldValue.increment(1), }
            }
        },
        paid_summary,
        payments,
    }, { merge: true })

    if (user_id) {
        coupons.forEach(coupon => {
            const { applied, is_torte_issued, tax_appliance } = coupon

            batch.set(dayRef, {
                discounts: {
                    object: {
                        bill: {
                            quantity: admin.firestore.FieldValue.increment(1),
                            total: admin.firestore.FieldValue.increment(applied)
                        } // skip bill_item
                    },
                    source: {
                        [is_torte_issued ? 'torte' : 'restaurant']: {
                            quantity: admin.firestore.FieldValue.increment(1),
                            total: admin.firestore.FieldValue.increment(applied)
                        },
                    },
                    tax_appliance: {
                        [tax_appliance]: {
                            quantity: admin.firestore.FieldValue.increment(1),
                            total: admin.firestore.FieldValue.increment(applied)
                        },
                    },
                    type: {
                        coupons: {
                            quantity: admin.firestore.FieldValue.increment(1),
                            total: admin.firestore.FieldValue.increment(applied)
                        } // skip loyalty and promotions
                    }
                },
            }, { merge: true })

            if (is_torte_issued) {
                batch.set(admin.firestore().collection('Torte').doc('Coupons'), {
                    used: admin.firestore.FieldValue.increment(1),
                    applied: admin.firestore.FieldValue.increment(applied),
                }, { merge: true })
            }
        })


        billItemSnapshots.forEach(doc => {
            const {
                units: { claimed, paid, available, denom, charged = {} },
                reference_ids: {
                    item_id,
                    variant_id
                },
            } = doc.data()

            // Number of users, number of units (denom), and if it is a split
            // Currently ignoring charged items, though you can compensate for those as well...
            const isUnclaimed = Object.keys(claimed).length === 1 && !!claimed[user_id]
            if (!available.length && isUnclaimed && !Object.keys(charged).length) {
                const users = { ...Object.keys(claimed), ...Object.keys(paid) }
                const splits = {
                    quantity: admin.firestore.FieldValue.increment(1),
                    users: admin.firestore.FieldValue.increment(Object.keys(users).length),
                    units: admin.firestore.FieldValue.increment(denom),
                }
                batch.set(dayRef.collection('DayItems').doc(item_id), { splits }, { merge: true })
                batch.set(dayRef.collection('DayItems').doc(item_id).collection('DayItemVariants').doc(variant_id || 'root'), { splits }, { merge: true })
            }
        })

        if (payment_intent) {
            const zip_code = payment_intent.metadata.zip_code
            if (zip_code) {
                batch.set(dayRef.collection('DayZipCodes').doc(zip_code), {
                    id: zip_code,
                    restaurant_id,
                    quantity: admin.firestore.FieldValue.increment(isFirstPayment ? 1 : 0),
                    total: admin.firestore.FieldValue.increment(deltaTotal),
                    tips: admin.firestore.FieldValue.increment(deltaTip),
                    discounts: admin.firestore.FieldValue.increment(deltaDiscounts),
                    unremitted: admin.firestore.FieldValue.increment(deltaUnremitted),
                    day_created,
                }, { merge: true })
            }
        }
    }

    return batch.commit()
}
