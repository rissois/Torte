/* eslint-disable no-await-in-loop */
/* eslint-disable no-unreachable */
// https://github.com/firebase/functions-samples/blob/master/stripe/functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { prepareStripe, useStripe, } = require('./helpers/stripe');
const { getSnapshotData, reportErrors } = require('./helpers/triggerFns');
const { centsToDollar } = require('./helpers/functions');

/**
 * Issue a refund on a single payment method
 */
exports.refund = functions.firestore
    .document('Restaurants/{restaurant_id}/Bills/{bill_id}/BillRefunds/{refund_id}')
    .onCreate(async (snap, context) => {
        const {
            id: bill_refund_id,
            bill_id,
            restaurant_id,
            user_id,
            total,
            tip,
            bill_payment_id,
        } = snap.data()

        const restaurantRef = admin.firestore().collection('Restaurants').doc(restaurant_id)
        const billRef = restaurantRef.collection('Bills').doc(bill_id)
        const billUserRef = billRef.collection('BillUsers').doc(user_id)
        const billPaymentRef = billRef.collection('BillPayments').doc(bill_payment_id)

        return admin.firestore().runTransaction(async transaction => {
            const {
                is_test,
                analytics_helper: { day_id },
                summary: { total: paymentTotal, tip: paymentTip },
                refunds: { total: refundedTotal, tip: refundedTip },
                payment_intent: { id: payment_intent_id },
                bill_refund_ids
            } = await getSnapshotData(billPaymentRef, transaction)

            if (bill_refund_ids.includes(bill_refund_id)) return null // already succeeded

            if (total > paymentTotal - refundedTotal) throw new functions.https.HttpsError('invalid-argument', `Requested refund is too large (payment has ${centsToDollar(paymentTotal - refundedTotal)} total and ${centsToDollar(paymentTip - refundedTip)} tip remaining)`)
            if (tip > paymentTip - refundedTip) throw new functions.https.HttpsError('invalid-argument', `Requested tip refund is too large (payment has ${centsToDollar(paymentTip - refundedTip)} tip remaining)`)

            prepareStripe(is_test)

            const {
                stripe: { [is_test ? 'test' : 'live']: { connect_id } }
            } = await getSnapshotData(restaurantRef, transaction)

            const refund = await useStripe(is_test).refunds.create({
                amount: total + tip,
                payment_intent: payment_intent_id,
                reason: 'requested_by_customer',
            }, {
                stripeAccount: connect_id,
            });

            if (refund.status !== 'succeeded') throw new functions.https.HttpsError('aborted', `Refund failed`)

            transaction.set(billPaymentRef, {
                refunds: {
                    total: admin.firestore.FieldValue.increment(total),
                    tip: admin.firestore.FieldValue.increment(tip),
                    bill_refund_ids: admin.firestore.FieldValue.arrayUnion(bill_refund_id),
                }
            }, { merge: true })

            transaction.set(snap.ref, {
                status: 'succeeded',
                payment_intent_id,
                refund,
                timestamps: {
                    completed: admin.firestore.FieldValue.serverTimestamp()
                }
            }, { merge: true })

            transaction.set(billRef, {
                refunds: {
                    total: admin.firestore.FieldValue.increment(total),
                    tip: admin.firestore.FieldValue.increment(tip),
                    bill_refund_ids: admin.firestore.FieldValue.arrayUnion(bill_refund_id),
                }
            }, { merge: true })

            transaction.set(billUserRef, {
                refunds: {
                    total: admin.firestore.FieldValue.increment(total),
                    tip: admin.firestore.FieldValue.increment(tip),
                    bill_refund_ids: admin.firestore.FieldValue.arrayUnion(bill_refund_id),
                }
            }, { merge: true })

            transaction.set(restaurantRef.collection('Days').doc(day_id), {
                refunds: {
                    total: admin.firestore.FieldValue.increment(total),
                    tip: admin.firestore.FieldValue.increment(tip),
                    quantity: admin.firestore.FieldValue.increment(1),
                }
            }, { merge: true })

        }).catch(async error => {
            await snap.ref.set({ status: 'failed', }, { merge: true })
            reportErrors('stripeRefund', 'refund')(error)
        })
    })
