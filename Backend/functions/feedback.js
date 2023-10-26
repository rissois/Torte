/* eslint-disable no-unreachable */
// https://github.com/firebase/functions-samples/blob/master/stripe/functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { getSnapshotData, reportErrors } = require('./helpers/triggerFns');

exports.feedback = functions.firestore
    .document('Restaurants/{restaurant_id}/Bills/{bill_id}/BillFeedbacks/{user_id}')
    .onWrite(async (change, context) => {
        if (!change.after.exists) return null // deletion only manually

        const { user_id, overall, service, food, comment, } = change.after.data();

        const {
            overall: before_overall = 0,
            service: before_service = 0,
            food: before_food = 0,
            comment: before_comment = '',
            is_new_feedback = false
        } = change.before.exists ? change.before.data() : { is_new_feedback: true }

        const billRef = change.after.ref.parent.parent
        const billUserRef = billRef.collection('BillUsers').doc(user_id)
        const restaurantRef = billRef.parent.parent

        return admin.firestore().runTransaction(async transaction => {
            const {
                analytics_helper: { day_id, day_created },
                timestamps: { created },
                restaurant_id,
            } = await getSnapshotData(billRef, transaction)

            transaction.set(billUserRef, {
                feedback: {
                    overall,
                    food,
                    service,
                    comment
                }
            }, { merge: true })

            const ratings = {
                feedback: {
                    overall: admin.firestore.FieldValue.increment(overall - before_overall),
                    overall_responses: admin.firestore.FieldValue.increment(Boolean(overall) - Boolean(before_overall)),
                    service: admin.firestore.FieldValue.increment(service - before_service),
                    service_responses: admin.firestore.FieldValue.increment(Boolean(service) - Boolean(before_service)),
                    food: admin.firestore.FieldValue.increment(food - before_food),
                    food_responses: admin.firestore.FieldValue.increment(Boolean(food) - Boolean(before_food)),
                    user_responses: admin.firestore.FieldValue.increment(change.after.exists - change.before.exists),
                }
            }

            transaction.set(billRef, ratings, { merge: true })

            const dayRef = restaurantRef.collection('Days').doc(day_id)
            transaction.set(dayRef, ratings, { merge: true })

            // WARNING!! Unlikely event of multiple identical comments will be clumpd together!
            if (comment !== before_comment) {
                transaction.set(dayRef, {
                    comments: admin.firestore.FieldValue.increment(Boolean(comment) - Boolean(before_comment)),
                }, { merge: true })

                transaction.set(billRef, {
                    feedback: {
                        comments: admin.firestore.FieldValue.arrayUnion(comment),
                    }
                }, { merge: true })

                transaction.set(dayRef.collection('DayComments').doc(billRef.id), {
                    id: billRef.id,
                    restaurant_id,
                    comments: admin.firestore.FieldValue.arrayUnion(comment),
                    timestamps: {
                        bill_created: created,
                        day_created,
                    }
                }, { merge: true })

                if (before_comment) {
                    transaction.set(billRef, {
                        feedback: {
                            comments: admin.firestore.FieldValue.arrayRemove(before_comment),
                        }
                    }, { merge: true })

                    transaction.set(dayRef.collection('DayComments').doc(billRef.id), {
                        comments: admin.firestore.FieldValue.arrayRemove(comment),
                    }, { merge: true })
                }
            }
        })
            .catch(reportErrors('feedback', 'feedback'))
    })