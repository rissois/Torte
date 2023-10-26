/* eslint-disable no-await-in-loop */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getSnapshotData, reportErrors } = require('./helpers/callableFns');

/*
    HANDLE ERRORS ON THE CLIENT https://firebase.google.com/docs/functions/callable#handle_errors_on_the_client
    A planned error will return its personalized message
    An unplanned error will return the reportErrors catch-all: 'An unknown error occurred. Please try again.'

    try {
        const result = await firebase.functions().httpsCallable('test-test')({
            restaurant_id: '',
            isTransaction: true,
            isThrowing: true,
            isErroring: true,
        })
        console.log(result)
    }
    catch (error) {
        console.log(error.message)
    }

    isThrowing
        GCP OUTPUT: test-test error: isThrowing
        CLIENT OUTPUT: {code: 'unknown', message: 'An unknown error occurred. Please try again.'}
    isError
        GCP OUTPUT: test-test error: Error: isErroring
        CLIENT OUTPUT: {code: 'cancelled', message: 'isErroring'}
    Invalid restaurant_id
        GCP OUTPUT: test-test error: Error: Restaurant not found
        CLIENT OUTPUT: {code: 'not-found', message: 'Restaurant not found'}
*/

exports.test = functions.https.onCall(async (data, context) => {
    return admin.firestore().runTransaction(async transaction => {
        const {
            restaurant_id,
            isThrowing,
            isErroring,
            isUnknown,
            isTransaction,
        } = data

        if (isUnknown) return unknown
        // eslint-disable-next-line no-throw-literal
        if (isThrowing) throw 'isThrowing'
        if (isErroring) throw new functions.https.HttpsError('cancelled', 'isErroring')

        const restaurantRef = admin.firestore().collection('Restaurants').doc(restaurant_id)
        const restaurant = await getSnapshotData(restaurantRef, isTransaction ? transaction : undefined)
        return restaurant
    })
        .catch(reportErrors('test', 'test'))
})