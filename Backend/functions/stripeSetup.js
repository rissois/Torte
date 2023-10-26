/* eslint-disable no-unreachable */
// https://github.com/firebase/functions-samples/blob/master/stripe/functions/index.js

const functions = require('firebase-functions');
const { reportErrors } = require('./helpers/callableFns');

const { prepareStripe, useStripe, getStripeCustomer, listPaymentMethods, checkCustomerHasValidPaymentMethod } = require('./helpers/stripe');

/**
 * Create a Stripe Setup Intent to add a payment method (card)
 * OR check whether the user already has a valid payment method (if not, create setup intent)
 * Setup Intents have optimized credentials for future payments, which helps avoid invalid or unoptimized payment methods
 * 
 * @param {Boolean} isTest Whether Stripe should be in Test mode
 * @param {Boolean} isIntentRequired MUST create a Setup Intent (adding a new card). Otherwise, only create a Setup Intent if no card on file (placing an order)
 */
exports.createSetupIntent = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("permission-denied", "The function must be called while authenticated.");
    }

    const user_id = context.auth.uid
    const { isTest = false, isIntentRequired } = data // Get from bill?

    prepareStripe(isTest)

    try {
        const customer_id = await getStripeCustomer(user_id, isTest)

        // If ordering, user only needs an intent IF they do not have a valid credit card on file
        if (!isIntentRequired) {
            const cards = await listPaymentMethods(customer_id, isTest)

            const isApproved = checkCustomerHasValidPaymentMethod(cards)

            if (isApproved) return { isApproved: true }
        }

        const setupIntent = await useStripe(isTest).setupIntents.create({
            customer: customer_id,
            usage: 'off_session', // default
        })

        return { clientSecret: setupIntent.client_secret, }
    }
    catch (error) {
        reportErrors('stripeSetup', 'createStripeSetup')(error)
    }
})