
// API REFERENCE: https://cloud.google.com/vision/docs/reference/rest
// Or is this the right reference? : https://googleapis.dev/nodejs/vision/latest/google.cloud.vision.v1.html
// SAMPLE: https://cloud.google.com/functions/docs/tutorials/ocr
// TEST: https://cloud.google.com/vision/docs/ocr
// DENSE DOCUMENTS (not applicable): https://cloud.google.com/vision/docs/fulltext-annotations

const admin = require('firebase-admin');
const functions = require('firebase-functions');

// Get a reference to the Cloud Vision API component
const Vision = require('@google-cloud/vision');
const { processAnnotation } = require('./helpers/processAnnotation');
const { reportErrors, getSnapshotData } = require('./helpers/callableFns');
const vision = new Vision.ImageAnnotatorClient();

exports.joinReceipt = functions.https.onCall(async (data, context) => {
    if (!context.auth) return { unnamed: true }
    // {
    //     throw new functions.https.HttpsError("permission-denied", "The function must be called while authenticated.");
    // }

    const user_id = context.auth.uid;
    const { receipt_id } = data

    return admin.firestore().runTransaction(async transaction => {
        const receiptRef = admin.firestore().collection('Receipts').doc(receipt_id)
        const receipt = await getSnapshotData(receiptRef, transaction)

        if (receipt.user_ids.includes(user_id)) return { rejoined: true }
        if (!receipt.is_approved) throw new functions.https.HttpsError("permission-denied", "This receipt is not ready for other users to join yet.");

        const { name } = await getSnapshotData(admin.firestore().collection('Users').doc(user_id), transaction)
        if (!name) return { unnamed: true }

        transaction.set(receiptRef, {
            user_ids: admin.firestore.FieldValue.arrayUnion(user_id),
            user_status: { [user_id]: { name, subtotal: 0, tip: 0, } },
        }, { merge: true })

        transaction.set(receiptRef.collection('ReceiptUsers').doc(user_id), {
            id: user_id,
            created_by: '',
            name: name,
            receipt_id,
            summary: { subtotal: 0, overage: 0, tip: 0, },
            receipt_item_ids: [],
            timestamps: { created: admin.firestore.FieldValue.serverTimestamp() }
        })

        transaction.set(admin.firestore().collection('Users').doc(user_id), {
            receipts_count: admin.firestore.FieldValue.increment(1)
        }, { merge: true })

        return { joined: true }
    }).catch(reportErrors('scanReceipt', 'joinReceipt'))
})

exports.scanReceipt = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("permission-denied", "The function must be called while authenticated.");
    }

    const user_id = context.auth.uid;
    const { receipt_id } = data

    const bucket = '#########'
    const file = `receipts/${user_id}/${receipt_id}`

    try {
        const fullTextAnnotation = await detectText(bucket, file);
        console.log(`File ${file} text detected`);

        const [restaurant, lineItems, summary,] = processAnnotation(fullTextAnnotation)
        console.log(`File ${file} text processed`)


        return batchBill(restaurant, lineItems, summary, user_id, receipt_id,)
    }
    catch (error) {
        reportErrors('scanReceipt', 'scanReceipt')(error)
    }
})

/**
* Detects the text in an image using the Google Vision API.
*
* @param {string} bucketName Cloud Storage bucket name.
* @param {string} filename Cloud Storage file name.
* @returns {Promise}
*/
const detectText = async (bucketName, filename) => {
    console.log(`Detecting text in image ${filename}`);

    /*
      Vision offers "text detection" and "document text detection", 
      Text detection worked best circa 2019/2020
      NB receipt example regards receipts as desnse document: https://cloud.google.com/vision/docs/fulltext-annotations
    */
    const [textDetections] = await vision.annotateImage({
        image: {
            source: {
                imageUri: `gs://${bucketName}/${filename}`
            }
        },
        imageContext: {
            languageHints: ['en'],
            // Could be useful to highlight regions of uncertainty (box color between Colors.red and Colors.background, with scale)
            // This was implemented in an earlier version with DOCUMENT_TEXT_DETECTION, but lost when switching to earlier version of TEXT_DETECTION
            // Might want to do a median / quartile sampling...
            // textDetectionParams: {enableTextDetectionConfidenceScore: true,} 
        },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION' }]
    });

    const [annotation] = textDetections.textAnnotations;
    const text = annotation ? annotation.description : '';
    console.log('Extracted text from image:', JSON.stringify(text));

    return textDetections.fullTextAnnotation
};

const batchBill = async (restaurant, lineItems, summary, user_id, receipt_id,) => {
    const batch = admin.firestore().batch()

    const receiptRef = admin.firestore().collection('Receipts').doc(receipt_id)

    const { name } = await getSnapshotData(admin.firestore().collection('Users').doc(user_id))

    let ordered = []

    lineItems.forEach((lineItem, index) => {
        const group_id = receiptRef.collection('fake').doc().id
        const floor = Math.floor(lineItem.cents / lineItem.quantity)
        let remainder = lineItem.cents % lineItem.quantity
        for (let i = 0; i < lineItem.quantity; i++, remainder--) {
            const subtotal = remainder > 0 ? floor + 1 : floor
            const receiptItemRef = receiptRef.collection('ReceiptItems').doc()
            ordered.push(receiptItemRef.id)

            const detected = {
                name: lineItem.name,
                captions: lineItem.captions || [],
                position: index + 1,
                summary: { subtotal },
            }

            batch.set(receiptItemRef, {
                id: receiptItemRef.id,
                receipt_id,
                units: {
                    denom: 1,
                    available: [{ subtotal, overage: 0 }],
                    claimed: {},
                },
                timestamps: { created: admin.firestore.FieldValue.serverTimestamp() },
                ...detected,
                detected, // Save the original translation
                group_id
            })
        }

        batch.set(receiptRef, {
            id: receipt_id,
            restaurant: { name: restaurant },
            is_approved: false,
            is_deleted: false,
            summary, // { subtotal: 0, tax: 0, total: 0, tips: 0, gratuity: 0, final: 0, }
            user_ids: [user_id],
            created_by: user_id,
            user_status: { [user_id]: { name, subtotal: 0, tip: 0, } },
            timestamps: {
                created: admin.firestore.FieldValue.serverTimestamp(),
                purchased: admin.firestore.FieldValue.serverTimestamp(),
            },
            receipt_item_status: {
                claimed: [],
                ordered,
            }
        })

        batch.set(receiptRef.collection('ReceiptUsers').doc(user_id), {
            id: user_id,
            created_by: '',
            name: name,
            receipt_id,
            summary: { subtotal: 0, overage: 0, tip: 0, },
            receipt_item_ids: [],
            timestamps: { created: admin.firestore.FieldValue.serverTimestamp() }
        })
    })

    return batch.commit()
}