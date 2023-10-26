/* eslint-disable no-unreachable */
// https://github.com/firebase/functions-samples/blob/master/stripe/functions/index.js

const functions = require('firebase-functions');
const { paymentBill, paymentAnalytics } = require('./helpers/payment');
const { paymentTemplate } = require('./helpers/paymentTemplate')


/**
 * ??? Convert to callable abstraction of createPaymentIntent?
 * Non-Stripe payments (cash, free meals,etc.)
 * 
 */
exports.payments = functions.firestore
    .document('Restaurants/{restaurant_id}/Bills/{bill_id}/BillPayments/{bill_payment_id}')
    .onWrite(async (change, context) => {

        /*
        * Stripe payments are never altered besides refunds
        * POS input payments can only be marked as is_deleted
        */
        if (!change.after.exists || change.after.data().status !== 'processing') return

        const { restaurant_id, bill_id, bill_payment_id } = context.params
        const before = change.before.exists && !change.before.data().is_deleted ? change.before.data() : paymentTemplate()
        const after = !change.after.data().is_deleted ? change.after.data() : paymentTemplate()
        const user_id = before.user_id || after.user_id
        const type = before.type || after.type

        // POS-confirmed payments
        if (type === 'cash' || type === 'card' || type === 'outside') {
            try {
                await paymentBill(before, after, restaurant_id, bill_id, bill_payment_id, user_id)
                try {
                    await paymentAnalytics(before, after,)
                }
                catch (error) {
                    // Just capturing both errors separately
                    console.log(`Analytics failed for ${type} ${bill_id}  ${bill_payment_id}: `, error)
                }
            }
            catch (error) {
                console.log(`Bill payment transaction failed for ${type} ${bill_id} ${bill_payment_id}: `, error.message)
            }
        }
        // Free meals
        else if (after.summary.final === 0) {
            try {
                const { billItemSnapshots, number_of_payments } = await paymentBill(before, after, restaurant_id, bill_id, bill_payment_id, user_id)
                try {
                    await paymentAnalytics(before, after, billItemSnapshots, number_of_payments, user_id)
                }
                catch (error) {
                    // Just capturing both errors separately
                    console.log(`Analytics failed for free ${bill_id}  ${bill_payment_id}: `, error)
                }
            }
            catch (error) {
                console.log(`Bill payment transaction failed for free ${bill_id} ${bill_payment_id}: `, error.message)
            }
        }
    })