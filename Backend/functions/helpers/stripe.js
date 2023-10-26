const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Stripe } = require('stripe');
const { getSnapshotData } = require('./callableFns');

let stripe = {};

/**
 * Initialize a Stripe instance for the function (keys are stored in environment configuration)
 * 
 * @param {Boolean} isTest Whether Stripe should be in Test mode
 */
exports.prepareStripe = (isTest) => {
    if (!stripe.test && isTest) {
        stripe.test = new Stripe(functions.config().stripe.test_secret_key, {
            apiVersion: '2020-08-27',
        });
    }
    if (!stripe.live && !isTest) {
        stripe.live = new Stripe(functions.config().stripe.live_secret_key, {
            apiVersion: '2020-08-27',
        });
    }
}

/**
 * Access Stripe object based on livemode
 * 
 * @param {Boolean} isTest Whether Stripe should be in Test mode
 */
const useStripe = exports.useStripe = (isTest) => stripe[isTest ? 'test' : 'live']

/**
 * Get appropriate Stripe field based on livemode
 * 
 * @param {Boolean} isTest Whether Stripe should be in Test mode
 */
const getStripeData = exports.getStripeData = (stripe_field = {}, isTest) => stripe_field[isTest ? 'test' : 'live']

/**
 * Retrieve Stripe customer ID for a user
 * Create a Stripe customer if user does not have one (important for first isTest call)
 * 
 * @param {String} user_id ID of the user
 * @param {Boolean} isTest Whether Stripe should be in Test mode
 */
exports.getStripeCustomer = async (user_id, isTest) => {
    const userRef = admin.firestore().collection('UsersPOS').doc(user_id)
    const user = await getSnapshotData(userRef)

    let { customer_id } = getStripeData(user.stripe, isTest)

    // Create customer_id if one does not exist
    if (!customer_id) {
        const customer = await useStripe(isTest).customers.create({
            email: user.email,
            metadata: {
                torte_user_id: user_id,
            }
        })

        customer_id = customer.id

        await userRef.set({
            stripe: {
                [isTest ? 'test' : 'live']: { customer_id }
            }
        }, { merge: true })
    }

    return customer_id
}

/**
 * Retrieve payment methods directly from Stripe
 * 
 * @param {String} customer_id Stripe customer ID of the user
 * @param {Boolean} isTest Whether Stripe should be in Test mode
 */
exports.listPaymentMethods = async (customer_id, isTest) => {
    return (await useStripe(isTest).paymentMethods.list({
        customer: customer_id,
        type: 'card',
    })).data
}

/**
 * Determine if any cards returned by listPaymentMethods are valid (not expired)
 * ??? What if bill started 11:59PM on the 31st?
 * 
 * @param {Array} cards Payment methods returned by listPaymentMethods
 */
exports.checkCustomerHasValidPaymentMethod = cards => {
    const today = new Date()

    return cards.some(card => (
        card.card.checks.cvc_check !== 'fail' &&
        card.card.checks.postal_code_check !== 'fail' &&
        (
            // Expiry year is after this year
            today.getFullYear() < card.card.exp_year ||
            // OR expiry year is this year, and expiry month is after this month
            (today.getFullYear() === card.card.exp_year && today.getMonth() < card.card.exp_month)
            // MONTH REMINDER: Date is 0-11, Stripe is 1-12                
        )
    ))
}