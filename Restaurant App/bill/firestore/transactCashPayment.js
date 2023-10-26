import firebase from "firebase";

export const transactCashPayment = (
    restaurantRef,
    bill_id,
    amount,
    tip,
    comment = '',
    tendered = 0,
) => {
    const billRef = restaurantRef.collection('Bills').doc(bill_id)

    return firebase.firestore().runTransaction(async transaction => {
        const bill = (await transaction.get(billRef)).data()
        if (!bill) throw 'Cannot find bill, this should not happen...'

        const {
            server,
            restaurant,
            analytics_helper: { day_id },
            is_test,
        } = bill;

        const billPaymentRef = restaurantRef
            .collection('Bills').doc(bill_id)
            .collection('BillPayments').doc()

        transaction.set(billPaymentRef, {
            id: billPaymentRef.id,
            type: 'cash',
            status: 'processing',
            is_test,
            is_deleted: false,

            bill_id,
            restaurant_id: restaurantRef.id,
            user_id: '',
            bill: { id: bill_id, number: bill.bill_number, code: bill.bill_code },
            restaurant,
            server,
            user: { id: '', name: '' },
            payment_intent: null,

            line_items: [],
            coupons: [],

            comment,
            tendered,

            summary: {
                subtotal: 0,
                tax: 0,
                discounts: 0,
                total: amount,
                tip: tip,
                final: amount + tip,
                unremitted: 0,
            },

            refunds: {
                total: 0,
                bill_refund_ids: [],
            },

            timestamps: {
                bill: bill.timestamps.created,
                created: firebase.firestore.FieldValue.serverTimestamp(),
            },
            analytics_helper: {
                bill_item_ids: [],
                coupon_ids: [],
                day_id,
                day_created: bill.analytics_helper.day_created,
            },
        }, { merge: true })
    })
}