/* eslint-disable no-unreachable */
// https://github.com/firebase/functions-samples/blob/master/stripe/functions/index.js

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { prepareStripe, useStripe, getStripeCustomer, } = require('./helpers/stripe');
const { centsToDollar } = require('./helpers/functions');

exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError("permission-denied", "The function must be called while authenticated.");
    }

    const user_id = context.auth.uid
    const {
        amount,
        tip,
        bill_id,
        restaurant_id,
        cancel_url,
        success_url,
    } = data

    const restaurantRef = admin.firestore().collection('Restaurants').doc(restaurant_id)

    const billRef = restaurantRef.collection('Bills').doc(bill_id)
    const billItemsRef = billRef.collection('BillItems')
    const billUserRef = billRef.collection('BillUsers').doc(user_id)

    return admin.firestore().runTransaction(async transaction => {

        const {
            is_test,
            bill_number,
            analytics_helper: { day_id },
            gratuities: {
                is_automatic_gratuity_on,
                percent,
            },
        } = (await transaction.get(billRef)).data()

        const {
            stripe: { [is_test ? 'test' : 'live']: { connect_id } }
        } = (await transaction.get(restaurantRef)).data()

        const {
            claim_summary: {
                subtotal,
                tax,
                bill_item_ids,
            }
        } = (await transaction.get(billUserRef)).data()

        if (is_automatic_gratuity_on && tip < Math.round(percent * subtotal / 100)) throw new functions.https.HttpsError('invalid-argument', `Tip is expected to be at least ${centsToDollar(Math.round(percent * subtotal / 100))}`)

        const billItemSnapshots = await Promise.all(bill_item_ids.map(bill_item_id => transaction.get(billItemsRef.doc(bill_item_id))))


        // Check BillItems matches BillUser expectation
        let sumSubtotal = 0
        let sumTax = 0
        let lineItems = []
        let line_items = []

        billItemSnapshots.forEach(doc => {
            const {
                id,
                name,
                captions: { line_break: caption, one_line: description },
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

            lineItems.push({
                bill_item_id: id,
                num: myUnits.length,
                denom,
                caption,
                name,
                subtotal: itemSubtotal,
                units: myUnits,
            })

            line_items.push({
                name: denom > 1 ? `/${denom} ${name}` : name,
                amount: itemSubtotal,
                currency: 'usd',
                quantity: myUnits.length,
                ...!!description && { description }
            })
        })

        if (sumSubtotal !== subtotal || sumTax !== tax) throw new functions.https.HttpsError('invalid-argument', 'Item math is not adding up. Please clear your selections and try again, or pay through your server.')

        // ??? Check automatic gratuity lines up... perhaps save automatic_gratuity percent value ONTO the bill so it does not change

        const final = subtotal + tax + tip
        if (final !== amount) throw new functions.https.HttpsError('invalid-argument', 'Amount requested does not match expected.  Please clear your selections and try again, or pay through your server.')

        prepareStripe(is_test)
        const customer_id = await getStripeCustomer(user_id, is_test)

        const session = await useStripe(is_test).checkout.sessions.create({
            mode: 'payment',
            cancel_url,
            success_url,
            line_items,
            payment_method_types: ['card'],
            customer: customer_id,
            metadata: {
                restaurant_id,
                bill_id,
                user_id,
                connect_id,
                day_id,
                bill_number,
            }
        },
            // {
            //     stripeAccount: connect_id,
            // }
        )

        return session
    }).catch(error => {
        console.log('stripePayment createPaymentIntent error: ', error)
        throw new functions.https.HttpsError('internal', 'We cannot process your request at this time. Please pay through your server.')
    })
})