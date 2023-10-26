const functions = require('firebase-functions');

/**
 * Removes trailing 's' from a string
 * Returns singular of text
 *
 * @param {String} text
 */
const singularize = text => text.slice(-1) === 's' ? text.slice(0, -1) : text

/**
 * Getter function to fetch document and throw error if not found
 * Returns the document data
 *
 * @param {Object} ref Firestore reference to document.
 */
exports.getSnapshotData = async (ref, transaction) => {
    const snap = await (transaction ? transaction.get(ref) : ref.get())

    // if does not exist, throw with collection name
    if (!snap.exists) throw new functions.https.HttpsError('not-found', `${singularize(ref.parent.id)} not found.`)

    return snap.data()
}

/**
 * Log, report, and return error
 * Pass-through nested HttpsError
 *
 * @param {String} fileName Firestore reference to document.
 * @param {String} functionName Firestore reference to document.
 */
exports.reportErrors = (fileName, functionName) => error => {
    console.error(`${fileName}-${functionName} error: ${error}`)

    // Pass-through (e.g. for transactions)
    if (error instanceof functions.https.HttpsError) throw error

    throw new functions.https.HttpsError('unknown', 'An unknown error occurred. Please try again.', error)
}