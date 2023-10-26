/* eslint-disable no-unreachable */
// https://github.com/firebase/functions-samples/blob/master/stripe/functions/index.js

const functions = require('firebase-functions');
const { prepareStripe, useStripe, getStripeCustomer, } = require('./helpers/stripe');




const createStripeEphemeralKey = async (customer_id, isTest) => {
    return await useStripe(isTest).ephemeralKeys.create(
        { customer: customer_id },
        { apiVersion: '2020-08-27' }
    )
}

exports.createEphemeralKey = functions.https.onCall(async (data, context) => {
    /*
        EPHEMERAL KEY GRANTS SDK TEMPORARY ACCESS TO CUSTOMER
        for creating payment sheet on the PayScreen
        and for editing credit cards
    */

    const { isTest = false } = data // Get from bill?
    const user_id = context.auth.uid

    prepareStripe(isTest)

    try {
        const customer_id = await getStripeCustomer(user_id, isTest)

        const ephemeralKey = await createStripeEphemeralKey(customer_id, isTest)

        return { customer_id, ephemeral_key: ephemeralKey.secret }
    }
    catch (error) {
        console.log('stripeRetrieveCustomer: ', error)
        // HANDLE ERROR
        return { error: true }
    }
})