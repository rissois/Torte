const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getSnapshotData, reportErrors } = require('./helpers/triggerFns');


// Must initialize stripe inside the function to avoid odd error...
// https://github.com/googleapis/google-auth-library-nodejs/issues/798

/**
 * Name, phone, and walked_thru are provided through the app
 */
exports.initializeUser = functions.firestore
    .document('Users/{userID}')
    .onCreate(async (snap, context) => {
        const id = context.params.userID

        return admin.firestore().runTransaction(async transaction => {
            // User number (count)
            let userCountRef = admin.firestore().collection('Torte').doc('UserCount')
            let { count } = await getSnapshotData(userCountRef, transaction)
            transaction.update(userCountRef, {
                count: admin.firestore.FieldValue.increment(1),
            })

            snap.ref.set({
                id,
                acct_no: count + 1,
                timestamps: {
                    created: admin.firestore.FieldValue.serverTimestamp(),
                    deleted: null,
                },
                eula: [Date.now()],
                tip_options: [0, 15, 18, 20],
            }, { merge: true })
        })
            .catch(reportErrors('userInitialize', 'initializeUser'))
    })