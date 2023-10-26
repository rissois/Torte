const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { Firestore } = require('@google-cloud/firestore');
const { prepareStripe, useStripe, } = require('./helpers/stripe');
const { getSnapshotData, reportErrors } = require('./helpers/triggerFns');

exports.couponTransfer = functions.firestore
    .document('UsersPOS/{user_id}/Coupons/{coupon_id}')
    .onUpdate(async (change, context) => {
        {
            const { transfer, is_torte_issued, applied } = change.after.data()

            if (transfer) return null
            if (!is_torte_issued) return null
            if (!applied) return null
        }

        admin.firestore().runTransaction(async transaction => {
            const { stripe: { [is_test ? 'test' : 'live']: { connect_id } } } = await getSnapshotData(admin.firestore().collection('Restaurants').doc(restaurant_id), transaction)
            const { transfer, is_torte_issued, applied, is_test, restaurant_id, bill_payment_id, bill_number } = await getSnapshotData(change.after.ref, transaction)

            // Double check
            if (transfer) return null
            if (!is_torte_issued) return null
            if (!applied) return null

            prepareStripe(is_test)

            const new_transfer = await useStripe(is_test).transfers.create({
                amount: applied,
                currency: 'usd',
                destination: connect_id,
                description: 'Discount for bill #' + bill_number,
                transfer_group: bill_payment_id,
            })

            transaction.set(change.after.ref, {
                timestamps: {
                    transfer: Firestore.FieldValue.serverTimestamp(),
                },
                transfer: new_transfer
            }, { merge: true })
        })
            .catch(reportErrors('coupons', 'couponTransfer'))
    })