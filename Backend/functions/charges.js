/* eslint-disable consistent-return */
/* eslint-disable no-unreachable */
// https://github.com/firebase/functions-samples/blob/master/stripe/functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { prepareStripe, useStripe, getStripeCustomer, } = require('./helpers/stripe');
const { createPayment } = require('./helpers/paymentTemplate');
const { getSnapshotData, reportErrors } = require('./helpers/callableFns');

const TORTE_FEE_PERCENT = 3
const STRIPE_MINIMUM_CENTS = 50

/**
 * When units cannot be evenly proportioned among all expected payers
 * Returns new units
 *
 * @param {Number} subtotal available (unclaimed) subtotal
 * @param {Number} tax available (unclaimed) tax
 * @param {Number} denom number of users responsible for paying for this item
 */
const redistributeRemainingUnits = (subtotal, tax, denom) => {
    const exactPortionSubtotal = subtotal / denom
    const minPortionSubtotal = Math.floor(exactPortionSubtotal)
    const moduloPortionSubtotal = subtotal % denom
    const exactPortionTax = tax / denom
    const minPortionTax = Math.floor(exactPortionTax)
    const moduloPortionTax = tax % denom

    const exactPortionTotal = exactPortionSubtotal + exactPortionTax

    available = []

    for (let i = 0; i < denom; i++) {
        const portionSubtotal = minPortionSubtotal + (i < moduloPortionSubtotal)
        const portionTax = minPortionTax + (i >= (denom - moduloPortionTax))
        available.push({
            subtotal: portionSubtotal,
            tax: portionTax,
            overage: (portionSubtotal + portionTax) - exactPortionTotal,
            is_redistributed: true
        })
    }

    return available.sort((a, b) => a.overage - b.overage)
}

/**
 * Attempt to charge unpaid bills to participating users
 *
 * @param {Number} bill_id available (unclaimed) subtotal
 * @param {Number} restaurant_id available (unclaimed) tax
 */
exports.initiateCharges = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "Charges can only be made while authenticated.");

    const {
        bill_id,
        restaurant_id,
    } = data

    if (context.auth.uid !== restaurant_id) throw new functions.https.HttpsError("permission-denied", "Charges can only be made by the restaurant.");

    const restaurantRef = admin.firestore().collection('Restaurants').doc(restaurant_id)
    const billRef = restaurantRef.collection('Bills').doc(bill_id)
    const billItemsRef = billRef.collection('BillItems')
    const usersRef = admin.firestore().collection('UsersPOS')

    return admin.firestore().runTransaction(async transaction => {
        const bill = await getSnapshotData(billRef, transaction)
        const {
            timestamps,
            bill_number,
            analytics_helper: { day_id },
            user_ids,
            user_status,
            is_test: isTest,
            bill_item_status,
            payments,
        } = bill

        // Nothing to charge
        if (bill.order_summary.total <= bill.paid_summary.total) return

        // Torte policy: Can only charge users that ordered through Torte
        // Reason 1: Only guaranteed to have credit card if ordered through Torte
        // Reason 2: Prevent sending bill link to victims
        if (!user_ids.length || !Object.keys(user_status).some(user_id => user_status[user_id].order_total > 0)) return

        const {
            gratuities: { charge: { default_option } },
            stripe: { [isTest ? 'test' : 'live']: { connect_id } }
        } = await getSnapshotData(restaurantRef, transaction)

        // Charge was already attempted
        if (timestamps.charged) return

        const unpaidBillItemIDs = new Set([...bill_item_status.ordered, ...bill_item_status.claimed])
        const billItemSnapshots = await Promise.all([...unpaidBillItemIDs].map(bill_item_id => transaction.get(billItemsRef.doc(bill_item_id))));

        // Skipping BillUsers (overages, etc.)

        // Any users who ordered, but did not pay are liable for server items
        let usersLiableForServerItems = Object.keys(user_status).filter(user_id => user_status[user_id].order_total && !user_status[user_id].paid_total) // vs number_of_payments
        // If all users paid, any user who ordered is liable for server items
        if (!usersLiableForServerItems.length) usersLiableForServerItems = Object.keys(user_status).filter(user_id => user_status[user_id].order_total)

        let userSummary = user_ids.reduce((acc, user_id) => ({ ...acc, [user_id]: { subtotal: 0, tax: 0, overage: 0, lineItems: [], } }), {})
        billItemSnapshots.forEach(doc => {
            let {
                id,
                name,
                captions: { line_break: caption },
                units: {
                    denom,
                    claimed, // will carry authentic units
                    available,
                    paid,
                },
                user_id,
                position,
            } = doc.data()

            let precharged = {} // will carry redistributed units

            const is_server_item = user_id === 'server'

            if (available.length) {
                // User who orders must pay for the item
                if (user_id && !is_server_item) {
                    if (!claimed[user_id]) claimed[user_id] = available
                    else claimed[user_id] = [...claimed[user_id], ...available]

                    available.forEach(unit => {
                        userSummary[user_id].overage += unit.overage
                    })
                }
                else {
                    // Any usersLiableForServerItems that has not claimed/paid is liable for the remainder
                    let usersLiableForTHISItem = usersLiableForServerItems.filter(user_id => !paid[user_id] && !claimed[user_id])
                    // If all usersLiableForServerItems have claimed/paid, then they are all again liable for the remainder
                    if (!usersLiableForTHISItem.length) usersLiableForTHISItem = usersLiableForServerItems

                    // Distribute available units evenly if possible
                    if (available.length % usersLiableForTHISItem.length === 0) {
                        const copy = [...available]
                        usersLiableForTHISItem.forEach(user_id => {
                            for (let i = 0; i < available.length / usersLiableForTHISItem.length; i++) {
                                const userUnit = userSummary[user_id].overage + copy[copy.length - 1].overage < 0.5 ? copy.pop() : copy.shift()
                                if (!claimed[user_id]) claimed[user_id] = [userUnit]
                                else claimed[user_id].push(userUnit)

                                userSummary[user_id].overage += userUnit.overage
                            }
                        })
                    }
                    // Otherwise, redistribute
                    else {
                        let unclaimedSubtotal = 0
                        let unclaimedTax = 0

                        available.forEach(unit => {
                            unclaimedSubtotal += unit.subtotal
                            unclaimedTax += unit.tax
                        })

                        let newUnits = redistributeRemainingUnits(unclaimedSubtotal, unclaimedTax, usersLiableForTHISItem.length)

                        usersLiableForTHISItem.forEach(user_id => {
                            const userUnit = userSummary[user_id].overage + newUnits[newUnits.length - 1].overage < 0.5 ? newUnits.pop() : newUnits.shift()

                            // Redistributed units go directly to pre-charged
                            // As they get a unique lineItem entry ("Partial" with 1/1 proportion)
                            precharged[user_id] = [userUnit]

                            userSummary[user_id].subtotal += userUnit.subtotal
                            userSummary[user_id].tax += userUnit.tax
                            userSummary[user_id].overage += userUnit.overage

                            // redistributed units get unique "partial" name
                            userSummary[user_id].lineItems.push({
                                bill_item_id: id,
                                num: 1,
                                denom: 1,
                                caption,
                                name: 'Partial ' + name,
                                subtotal: userUnit.subtotal,
                                units: precharged[user_id],
                                is_server_item,
                                position,
                            })
                        })
                    }
                }
            }

            // Transfer all claimed units into pre-charged
            Object.keys(claimed).forEach(user_id => {
                if (!precharged[user_id]) precharged[user_id] = claimed[user_id]
                else precharged[user_id] = [...precharged[user_id], ...claimed[user_id]]

                let subtotal = 0
                let tax = 0
                claimed[user_id].forEach(unit => {
                    subtotal += unit.subtotal
                    tax += unit.tax
                })
                userSummary[user_id].subtotal += subtotal
                userSummary[user_id].tax += tax

                userSummary[user_id].lineItems.push({
                    bill_item_id: id,
                    num: claimed[user_id].length,
                    denom,
                    caption,
                    name,
                    subtotal,
                    units: claimed[user_id],
                    is_server_item,
                    position,
                })
            })

            transaction.set(billItemsRef.doc(id), {
                units: {
                    available: [],
                    // claimed: {}, do not adjust claimed in case of failure
                    precharged,
                }
            }, { merge: true })
        })

        /*
        * ACCOUNT FOR OUTSIDE PAYMENTS
        * Remove these outside payments proportional to each user
        * ONLY measure for users with a POSITIVE total
        * 
        * REMINDER: A charge only occurs if there is an amount owed
        */
        const nonTorteTotals = Object.keys(payments).reduce((total, type) => {
            if (type === 'app' || type === 'charge') return total
            // cash, swipe, manual, outside
            return total + payments[type].total
        }, 0)

        if (nonTorteTotals) {
            let remainingNonTorteTotal = nonTorteTotals

            // Collect users that owe a positive amount
            const { chargeTotals, positiveUsers } = Object.keys(userSummary).reduce((acc, user_id) => {
                const userTotal = userSummary[user_id].subtotal + userSummary[user_id].tax
                if (userTotal > 0) return { chargeTotals: acc.chargeTotals + userTotal, positiveUsers: [...acc.positiveUsers, user_id] }
                return acc
            }, { chargeTotals: 0, positiveUsers: [] })

            // Reduce charge subtotal and tax proportionally 
            positiveUsers.forEach(user_id => {
                const { subtotal, tax } = userSummary[user_id]
                let userProportion = nonTorteTotals * (subtotal + tax) / chargeTotals

                if (Math.ceil(userProportion) < remainingNonTorteTotal) {
                    userProportion = Math.round(userProportion)
                }
                else {
                    userProportion = remainingNonTorteTotal
                }

                if (userProportion) {
                    remainingNonTorteTotal -= userProportion

                    // Negative values
                    const lessSubtotal = Math.round(userProportion * subtotal / (subtotal - tax))
                    const lessTax = userProportion - lessSubtotal

                    userSummary[user_id].subtotal -= lessSubtotal
                    userSummary[user_id].tax -= lessTax
                    userSummary[user_id].lineItems.push({
                        bill_item_id: 'correction',
                        num: 1,
                        denom: 1,
                        position: '99999999999',
                        caption: '',
                        name: 'Balance correction',
                        subtotal: -lessSubtotal,
                        units: [{ subtotal: -lessSubtotal, tax: -lessTax, overage: 0 }],
                        is_server_item: true,
                    })
                }
            })
        }

        prepareStripe(isTest)

        transaction.set(billRef, { timestamps: { charged: admin.firestore.FieldValue.serverTimestamp(), } }, { merge: true })

        /*
        * Charge any user with lineItems
        */
        return await Promise.all(Object.keys(userSummary).map(async user_id => {
            const { subtotal, tax, lineItems } = userSummary[user_id]
            if (!lineItems.length) return

            let tip = 0
            let fee = 0
            if (subtotal > 0) {
                tip = Math.round(subtotal * default_option / 100)
                fee = Math.round(subtotal * TORTE_FEE_PERCENT / 100)
            }

            let amount = subtotal + tax + tip + fee

            const billPaymentRef = billRef.collection('BillPayments').doc()
            let charge = createPayment(bill, {
                id: billPaymentRef.id,
                type: 'charge',
                status: 'processing',
                user_id,
                user: { id: user_id, name: user_status[user_id].name },
                payment_intent: null,
                line_items: lineItems,
                summary: {
                    fee,
                    subtotal,
                    tax,
                    total: subtotal + tax,
                    tip,
                    final: amount > 0 ? amount : 0,
                    unremitted: amount < 0 ? -amount : 0,
                },
                analytics_helper: {
                    bill_item_ids: lineItems.map(({ bill_item_id }) => bill_item_id),
                }
            })

            charge.timestamps.created = admin.firestore.FieldValue.serverTimestamp()

            console.log('TRY')
            // Try each user individually, and catch their errors individually
            try {
                if (amount > 0) {
                    if (amount < STRIPE_MINIMUM_CENTS) {
                        fee += amount - STRIPE_MINIMUM_CENTS
                        amount = STRIPE_MINIMUM_CENTS
                    }

                    const customer_id = await getStripeCustomer(user_id, isTest)

                    /*
                        A NOTE ON CONNECTED ACCOUNTS:
                        You must clone a payment method (or customer) into the connected account to use them
                        We are only cloning the payment method.
                    */

                    const cards = await usersRef.doc(user_id).collection('Cards').where('is_deleted', '==', false).where('is_test', '==', isTest).orderBy('is_favorite', 'desc').get()

                    const today = new Date()
                    let card = cards.docs.find(cardDoc => today.getFullYear() < cardDoc.data().exp_year
                        || (
                            today.getFullYear() === cardDoc.data().exp_year &&
                            // Date is 0-11, Stripe is 1-12
                            today.getMonth() < cardDoc.data().exp_month
                            // ??? What if bill started before expiration, but paid after expiration?
                        ))

                    const { payment_method_id, zip_code, id: card_id } = card.data()

                    const connectedPaymentMethod = await useStripe(isTest).paymentMethods.create({
                        customer: customer_id,
                        payment_method: payment_method_id
                    }, {
                        stripeAccount: connect_id
                    })

                    charge.payment_intent = await useStripe(isTest).paymentIntents.create({
                        amount,
                        currency: 'usd',
                        // customer: customer_id,
                        payment_method: connectedPaymentMethod.id,
                        application_fee_amount: fee,
                        off_session: true,
                        confirm: true,
                        metadata: {
                            restaurant_id,
                            bill_id,
                            bill_payment_id: billPaymentRef.id,
                            user_id,
                            connect_id,
                            torte_payment_method_id: payment_method_id, // to distinguish it from the restaurant / connectedPaymentMethod
                            card_id,
                            zip_code,
                            day_id,
                            bill_number,
                            user_payment_number: user_status[user_id].number_of_payments + 1,
                        },
                        transfer_group: billPaymentRef.id, // Allows linking payments (e.g. this payment with its discount transfers) 
                    },
                        {
                            idempotencyKey: billPaymentRef.id,
                            stripeAccount: connect_id,
                        })
                }

                console.log('END TRY')

            }
            catch (error) {
                console.log('CATCH')
                // Want to preserve the charge information, do not error out
                console.log(`ERROR: restaurant ${restaurant_id} bill ${bill_id} user ${user_id}: `, error)
                charge.status = 'failed'
                console.log('END CATCH')
            }
            finally {
                console.log('FINALLY')
                transaction.set(billPaymentRef, charge)
                console.log('END FINALLY')
            }

            console.log('END')
        }))
    })
        .catch(error => {
            // timestamps.charged with remaining balance will be reported as a failed charge
            billRef.set({ timestamps: { charged: admin.firestore.FieldValue.serverTimestamp(), } }, { merge: true })
            reportErrors('charges', 'initiateCharges')(error)
        })

})