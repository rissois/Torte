// https://firebase.google.com/docs/firestore/solutions/presence

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Since this code will be running in the Cloud Functions environment
// we call initialize Firestore without any arguments because it
// detects authentication from the environment.
const firestore = admin.firestore();

// Create a new function which is triggered on changes to /status/{uid}
// Note: This is a Realtime Database trigger, *not* Firestore.
exports.onRestaurantStatusChanged = functions.database.ref('/Restaurants/Status/{uid}').onUpdate(
    async (change, context) => {
        // Get the data written to Realtime Database
        const eventStatus = change.after.val();

        // Then use other event data to create a reference to the
        // corresponding Firestore document.
        const userStatusFirestoreRef = firestore.collection('Restaurants').doc(context.params.uid);

        // It is likely that the Realtime Database change that triggered
        // this event has already been overwritten by a fast change in
        // online / offline status, so we'll re-read the current data
        // and compare the timestamps.
        const statusSnapshot = await change.after.ref.once('value');
        const status = statusSnapshot.val();
        functions.logger.log(status, eventStatus);
        // If the current timestamp for this data is newer than
        // the data that triggered this event, we exit this function.
        if (status.last_changed > eventStatus.last_changed) {
            return null;
        }

        // TWEAKED THIS CODE to be consistent with storage as a server timestamp
        // Otherwise, we convert the last_changed field to a Date
        eventStatus.last_changed = admin.firestore.Timestamp.fromDate(new Date(eventStatus.last_changed));

        // ... and write it to Firestore.
        return userStatusFirestoreRef.update({ status: eventStatus });
    });