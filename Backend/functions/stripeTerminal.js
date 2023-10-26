/* eslint-disable no-unreachable */
// https://github.com/firebase/functions-samples/blob/master/stripe/functions/index.js

const functions = require('firebase-functions');

const { useStripe, prepareStripe, } = require('./helpers/stripe');

exports.stripeTerminalConnectionToken = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("permission-denied", "The function must be called while authenticated.");
    }

    // const user_id = context.auth.uid
    const { is_test = false, } = data

    prepareStripe(is_test)

    try {
        const token = await useStripe(is_test).terminal.connectionTokens.create();

        console.log(`token.secret ${token.secret}`)

        return { secret: token.secret }
    }
    catch (error) {
        console.log('createSetupIntent: ', error)
        throw new functions.https.HttpsError("unknown", "Unable to access Terminal token");

    }
})