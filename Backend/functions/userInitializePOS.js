const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { createCoupon } = require('./helpers/couponTemplate');
const { prepareStripe, useStripe } = require('./helpers/stripe');
const { getSnapshotData, reportErrors } = require('./helpers/triggerFns');


// Must initialize stripe inside the function to avoid odd error...
// https://github.com/googleapis/google-auth-library-nodejs/issues/798

const isNewUserCouponActive = false

/**
 * Complete initialization of new users (Stripe and coupon)
 */
exports.initializeUserPOS = functions.firestore
    .document('UsersPOS/{userID}')
    .onCreate(async (snap, context) => {
        const { email = '', id, name = '', is_anonymous = false } = snap.data()

        return admin.firestore().runTransaction(async transaction => {
            // Create Stripe customer for user
            prepareStripe()
            let stripeDetails = { metadata: { torte_user_id: id }, }
            if (email) stripeDetails.email = email
            if (name) stripeDetails.name = name
            const customer = await useStripe().customers.create(stripeDetails);

            let userCountRef = admin.firestore().collection('Torte').doc('UserCount')
            let { count } = await getSnapshotData(userCountRef, transaction)
            transaction.update(userCountRef, {
                count: admin.firestore.FieldValue.increment(1),
                ...is_anonymous && { anonymous_count: admin.firestore.FieldValue.increment(1) }
            })

            if (isNewUserCouponActive && !is_anonymous) {
                let couponRef = snap.ref.collection('Coupons').doc()
                let signupCoupon = createCoupon({
                    id: couponRef.id,
                    banner: 'Welcome to Torte!',
                    conditions: ['Non-refundable'],
                    header: '$3 off any meal',
                    is_torte_issued: true,
                    text: [
                        'Only at restaurants accepting Torte.',
                        'Must pay through the app.'
                    ],
                    user_id: id,
                    value: 300,
                })
                couponTemplate.timestamps.created = admin.firestore.FieldValue.serverTimestamp()

                transaction.set(couponRef, signupCoupon)
            }

            snap.ref.set({
                acct_no: count + 1,
                date_joined: admin.firestore.FieldValue.serverTimestamp(),
                id,
                is_admin: false,
                is_anonymous,
                name,
                phone: '',
                pos: {
                    eula: {
                        dates: [],
                        is_needed: true,
                    },
                    walkthroughs: [],
                },
                stripe: {
                    live: { customer_id: customer.id, },
                    test: { customer_id: '' }
                },
                torte: {
                    eula: {
                        dates: [],
                        is_needed: true,
                    },
                },
            },
                { merge: true })



        })
            .catch(reportErrors('userInitialize', 'initializeUser'))
    })