/* eslint-disable no-unreachable */
// https://github.com/firebase/functions-samples/blob/master/stripe/functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { reportErrors } = require('./helpers/callableFns');
const { useStripe, prepareStripe, getStripeCustomer, listPaymentMethods, } = require('./helpers/stripe');

/**
 * (UNUSED) Getter for Stripe-stored credit cards
 * 
 * @param {Boolean} isTest Whether Stripe should be in Test mode
 */
exports.getPaymentMethods = functions.https.onCall(async (data, context) => {
    const user_id = context.auth.uid
    if (!user_id) throw new functions.https.HttpsError('unauthenticated', 'You must have an account to create a bill.')

    const { isTest = false } = data // Get from bill?

    prepareStripe(isTest)

    try {
        const customer_id = await getStripeCustomer(user_id, isTest)

        return await listPaymentMethods(customer_id, isTest)
    }
    catch (error) {
        reportErrors('stripePaymentMethods', 'getPaymentMethods')(error)
    }
})

/**
 * Delete credit card from Stripe
 * ??? Why doesn't this also delete from Firestore?
 * 
 * @param {Boolean} isTest Whether Stripe should be in Test mode
 * @param {String} payment_method_id ID of the payment method to delete
 * @param {String} card_id ID of card in Firestore
 */
exports.deletePaymentMethod = functions.https.onCall(async (data, context) => {
    const user_id = context.auth.uid
    if (!user_id) throw new functions.https.HttpsError('unauthenticated', 'You must have an account to create a bill.')

    const { payment_method_id, card_id, isTest = false } = data

    prepareStripe(isTest)

    try {
        const paymentMethod = await useStripe(isTest).paymentMethods.retrieve(payment_method_id)

        const customer_id = await getStripeCustomer(user_id, isTest)

        if (customer_id !== paymentMethod.customer) return admin.firestore().collection('UsersPOS').doc(user_id).collection('Cards').doc(card_id).update({ is_deleted: true })

        await useStripe(isTest).paymentMethods.detach(payment_method_id)

        // return { success: true }
        return admin.firestore().collection('UsersPOS').doc(user_id).collection('Cards').doc(card_id).update({ is_deleted: true })
    }
    catch (error) {
        reportErrors('stripePaymentMethods', 'deletePaymentMethod')(error)
    }
})