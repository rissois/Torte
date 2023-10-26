const moment = require('moment-timezone');

const functions = require('firebase-functions');
const { dayTemplate } = require('./helpers/dayTemplate');

// Create a new client
const admin = require('firebase-admin');
const { reportErrors } = require('./helpers/triggerFns');

/* 
NOTE: You will need the following timezones for full US coverage:

https://en.wikipedia.org/wiki/List_of_tz_database_time_zones

America/New_York
America/Chicago
America/Denver
America/Phoenix
America/Los_Angeles

America/Anchorage
Pacific/Honolulu
... technically America/Adak

Consider an array or applicable timezones,
be careful of having no day on a restaurants creation
*/

/**
 * Every day at 1AM, create the Day analytics document FOR THE FOLLOWING DAY
 * For all restaurants in Torte
 */
// Runs at 1AM each day (NY time)
exports.dailyDays = functions.pubsub.schedule('00 1 * * *').timeZone('America/New_York').onRun((context) => {
    let doc_ids = []

    return admin.firestore().collection('Restaurants').where('time.day_timezone', '==', 'America/New_York').get().then(async docs => {
        const zeroHour = moment.tz('America/New_York').add(1, 'days').startOf('day')

        return await Promise.allSettled(docs.docs.map(async (doc, index) => {
            doc_ids[index] = doc.id
            const dayRef = doc.ref.collection('Days').doc()
            const batch = admin.firestore().batch()
            batch.set(dayRef, {
                ...dayTemplate(),
                id: dayRef.id,
                restaurant_id: doc.id,
                timestamps: {
                    created: admin.firestore.Timestamp.fromMillis(zeroHour),
                },
                is_test: false,
            })
            batch.set(dayRef.parent.doc(dayRef.id + '_test'), {
                ...dayTemplate(),
                id: dayRef.id + '_test',
                restaurant_id: doc.id,
                timestamps: {
                    created: admin.firestore.Timestamp.fromMillis(zeroHour),
                },
                is_test: true,
            })
            return batch.commit()
        }))
    })
        .then(results => {
            // Report any failures
            results.forEach((result, index) => {
                if (result.status !== 'fulfilled') console.error(`dailyDays failed for ${doc_ids[index]}: ${result}`)
            })
            return null
        })
        .catch(reportErrors('dailyDays', 'dailyDays'))
})