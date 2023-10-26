/* eslint-disable no-unreachable */
// https://github.com/firebase/functions-samples/blob/master/stripe/functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { prepareStripe, useStripe, getStripeCustomer, } = require('./helpers/stripe');
const { paymentBill, paymentAnalytics } = require('./helpers/payment');
const { calculateDiscount } = require('./helpers/coupons');
const { createPayment, paymentTemplate } = require('./helpers/paymentTemplate');
const { centsToDollar } = require('./helpers/functions');
const { getSnapshotData, reportErrors } = require('./helpers/callableFns');

/**
 * Create a payment intent, which must be confirmed by the user
 * 
 * @param {Boolean} isTest Whether Stripe should be in Test mode
 * @param {String} payment_method_id ID of the payment method to delete
 * @param {String} card_id ID of card in Firestore
 */
exports.createPaymentIntent = functions.https.onCall(async (data, context) => {
    if (!context.auth) throw new functions.https.HttpsError("unauthenticated", "You must be logged in to make a payment.");

    const user_id = context.auth.uid
    const {
        amount,
        tip,
        coupon_ids,
        payment_method_id,
        bill_id,
        restaurant_id,
        card_id,
        zip_code,
        bill_payment_id,
    } = data

    const restaurantRef = admin.firestore().collection('Restaurants').doc(restaurant_id)

    const billRef = restaurantRef.collection('Bills').doc(bill_id)
    const billItemsRef = billRef.collection('BillItems')
    const billUserRef = billRef.collection('BillUsers').doc(user_id)
    const billPaymentRef = billRef.collection('BillPayments').doc(bill_payment_id)

    const userRef = admin.firestore().collection('UsersPOS').doc(user_id)
    const couponsRef = userRef.collection('Coupons')

    let payment = { id: bill_payment_id, user_id, bill_id, restaurant_id }

    return admin.firestore().runTransaction(async transaction => {
        const failedIdempotent = await transaction.get(billPaymentRef)
        if (failedIdempotent.exists) return null // Idempotency check

        const bill = await getSnapshotData(billRef, transaction)
        const {
            is_test,
            bill_number,
            analytics_helper: { day_id },
            gratuities: {
                is_automatic_gratuity_on,
                percent,
            },
            user_status: { [user_id]: { name } }
        } = bill

        payment = createPayment(bill, {
            id: bill_payment_id,
            type: 'app', // amount > 0 ? 'app' : 'free',
            status: 'processing',
            user_id,
            user: { id: user_id, name },
            payment_intent: null,
            line_items: [],
            coupons: [],
            summary: {
                subtotal: 0,
                tax: 0,
                discounts: 0,
                total: 0, //subtotal + tax - discounts,
                tip,
                final: amount > 0 ? amount : 0,
                unremitted: amount < 0 ? -amount : 0,
            },
        })

        payment.timestamps.created = admin.firestore.FieldValue.serverTimestamp()

        const {
            stripe: { [is_test ? 'test' : 'live']: { connect_id } }
        } = await getSnapshotData(restaurantRef, transaction)

        const {
            claim_summary: {
                subtotal,
                tax,
                bill_item_ids,
            }
        } = await getSnapshotData(billUserRef, transaction)
        payment.summary.subtotal = subtotal
        payment.summary.tax = tax
        payment.analytics_helper.bill_item_ids = bill_item_ids

        if (is_automatic_gratuity_on && tip < Math.round(percent * subtotal / 100)) throw new functions.https.HttpsError('invalid-argument', `Tip is expected to be at least ${centsToDollar(Math.round(percent * subtotal / 100))}`)

        const billItemSnapshots = await Promise.all(bill_item_ids.map(bill_item_id => transaction.get(billItemsRef.doc(bill_item_id))))

        const couponSnapshots = await Promise.all(coupon_ids.map(coupon_id => transaction.get(couponsRef.doc(coupon_id))))

        // Check BillItems matches BillUser expectation
        let sumSubtotal = 0
        let sumTax = 0
        billItemSnapshots.forEach(doc => {
            const {
                id,
                name,
                captions: { line_break: caption },
                units: {
                    denom,
                    claimed: { [user_id]: myUnits = [] }
                },
            } = doc.data()

            let itemSubtotal = 0

            myUnits.forEach(unit => {
                itemSubtotal += unit.subtotal
                sumTax += unit.tax
            })

            sumSubtotal += itemSubtotal

            payment.line_items.push({
                bill_item_id: id,
                num: myUnits.length,
                denom,
                caption,
                name,
                subtotal: itemSubtotal,
                units: myUnits,
            })
        })

        if (sumSubtotal !== subtotal || sumTax !== tax) throw new functions.https.HttpsError('invalid-argument', 'Item math is not adding up. Please clear your selections and try again, or pay through your server.')

        const today = new Date()
        let billRemaining = {
            remainingTip: tip,
            remainingTax: tax,
            remainingSubtotal: subtotal,
        }

        couponSnapshots.forEach(couponDoc => {
            const { header, id, timestamps, value, percent, is_torte_issued, restaurant_id: coupon_restaurant_id } = couponDoc.data()

            if (timestamps.used || (timestamps.expiration && timestamps.expiration.toDate() < today) || (!is_torte_issued && coupon_restaurant_id !== restaurant_id)) return null

            const applied = calculateDiscount(billRemaining, couponDoc.data())

            if (applied) {
                const tax_appliance = value ? 'value' : percent.is_pre_tax ? 'pre_tax' : 'post_tax'
                payment.coupons.push({ coupon_id: id, applied, header, is_torte_issued, tax_appliance })
                payment.summary.discounts += applied
            }
        })
        payment.analytics_helper.coupon_ids = payment.coupons.map(({ coupon_id }) => coupon_id)

        // ??? Check automatic gratuity lines up... perhaps save automatic_gratuity percent value ONTO the bill so it does not change

        payment.summary.total = payment.summary.subtotal + payment.summary.tax - payment.summary.discounts
        if (payment.summary.total + payment.summary.tip !== amount) throw new functions.https.HttpsError('invalid-argument', 'Values are not adding up. Please clear your selections and try again, or pay through your server.')

        let connectedPaymentMethod
        try {
            if (amount > 0) {
                prepareStripe(is_test)
                const customer_id = await getStripeCustomer(user_id, is_test)

                /*
                    A NOTE ON CONNECTED ACCOUNTS:
                    You must clone a payment method (or customer) into the connected account to use them
                    We are only cloning the payment method.
                */

                connectedPaymentMethod = await useStripe(is_test).paymentMethods.create({
                    customer: customer_id,
                    payment_method: payment_method_id
                }, {
                    stripeAccount: connect_id
                })

                payment.payment_intent = await useStripe(is_test).paymentIntents.create({
                    amount,
                    currency: 'usd',
                    // customer: customer_id,
                    payment_method: connectedPaymentMethod.id,
                    off_session: false,
                    metadata: {
                        restaurant_id,
                        bill_id,
                        bill_payment_id,
                        user_id,
                        connect_id,
                        torte_payment_method_id: payment_method_id, // to distinguish it from the restaurant / connectedPaymentMethod
                        card_id,
                        zip_code,
                        day_id,
                        bill_number,
                    },
                    transfer_group: bill_payment_id, // Allows linking payments (e.g. this payment with its discount transfers) 
                },
                    {
                        idempotencyKey: bill_payment_id,
                        stripeAccount: connect_id,
                    })
            }
        }
        catch (error) {
            console.log(`ERROR: restaurant ${restaurant_id} bill ${bill_id} user ${user_id}: `, error)
            // payment.status = 'failed'
            throw new functions.https.HttpsError('aborted', 'Error with Stripe. Please try again or pay through your server.')
        }

        transaction.set(billPaymentRef, payment)

        if (amount > 0) return { clientSecret: payment.payment_intent.client_secret, paymentMethodId: connectedPaymentMethod.id, }
        return null
    }).catch(async error => {
        payment.status = 'failed'
        await billPaymentRef.set(payment)
        reportErrors('stripePayment', 'createPaymentIntent')(error)
    })
})

/**
 * Stripe webhook listener for successful payment intent
 * Required for payments and charges processed through Stripe
 * 
 * @param {Boolean} isTest Whether Stripe should be in Test mode
 * @param {String} payment_method_id ID of the payment method to delete
 * @param {String} card_id ID of card in Firestore
 */
exports.paymentSuccessWebhook = functions.https.onRequest(async (request, response) => {

    if (request.body.type !== 'payment_intent.succeeded') {
        console.log('unexpected body type', request.body.type)
        return response.send()
    }

    const isTest = !request.body.livemode
    prepareStripe(isTest)

    let event;

    // Verify webhook signature and extract the event.
    // See https://stripe.com/docs/webhooks/signatures for more information.
    try {
        const webhookSecret = functions.config().stripe[isTest ? 'test_payment_webhook' : 'live_payment_webhook']

        event = await useStripe(isTest).webhooks.constructEvent(
            request.rawBody,
            request.headers['stripe-signature'],
            webhookSecret
        );
    } catch (err) {
        console.log(`webhook signature verification failed for ${bill_id} ${bill_payment_id}: `, err.message)
        return response.status(400).send(`Webhook Error: ${err.message}`);
    }

    const paymentIntent = event.data.object // https://stripe.com/docs/api/events/object

    const {
        restaurant_id,
        bill_id,
        user_id,
        bill_payment_id,
    } = paymentIntent.metadata

    /*
    Stripe docs recommend triggering an outside function, then immediately calling response.send
    */

    try {
        const { billPayment, billItemSnapshots, number_of_payments, } = await paymentBill(paymentTemplate(), undefined, restaurant_id, bill_id, bill_payment_id, user_id)
        if (billPayment.status !== 'processing') return

        try {
            await paymentAnalytics(paymentTemplate(), billPayment, billItemSnapshots, number_of_payments, user_id)
        }
        catch (error) {
            // Just capturing both errors separately
            console.log(`Analytics failed for ${bill_id}  ${bill_payment_id}: `, error)
        }
        finally {
            response.send()
        }
    }
    catch (error) {
        console.log(`Bill payment transaction failed for ${bill_id} ${bill_payment_id}: `, error.message)
        admin.firestore()
            .collection('Restaurants').doc(restaurant_id)
            .collection('Bills').doc(bill_id)
            .collection('BillPayments').doc(bill_payment_id)
            .update({ status: 'failed' })

        return response.status(400).send(`Firestore Error: ${error.message}`);
    }
})