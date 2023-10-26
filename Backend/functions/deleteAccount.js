// Consider immediate deleteUser + Cloud Task
// https://medium.com/@rogiervandenberg/google-cloud-task-queues-on-gcp-with-google-cloud-functions-22eb80fe34ba

const admin = require('firebase-admin');
const functions = require('firebase-functions');

const { reportErrors } = require('./helpers/callableFns');

exports.deleteAccount = functions.https.onCall(async (data, context) => {
    const user_id = context.auth.uid;
    const { isStorageDelete } = data

    try {
        const receiptRefs = await admin.firestore().collection('Receipts').where('user_ids', 'array-contains', user_id).get()

        await Promise.all(receiptRefs.docs.map(doc => {
            console.log('ID: ', doc.id)
            const batch = admin.firestore().batch()
            batch.set(doc.ref, {
                user_status: {
                    [user_id]: {
                        name: ''
                    }
                }
            }, { merge: true })

            batch.update(
                doc.ref.collection('ReceiptUsers').doc(user_id),
                { name: '' }
            )

            return batch.commit()
        }))


        console.log('isStorageDelete: ', isStorageDelete)
        if (isStorageDelete) {
            await admin.storage().bucket().deleteFiles({ prefix: `receipts/${user_id}/` })
        }

        await admin.firestore().collection('Users').doc(user_id).update({
            name: '',
            phone: {
                country: '',
                main: '',
            },
            timestamps: {
                deleted: admin.firestore.FieldValue.serverTimestamp()
            }
        }, { merge: true })

        await admin.auth().deleteUser(user_id)

    }
    catch (error) {
        reportErrors('deleteAccount', 'deleteAccount')(error)
    }

    return
})