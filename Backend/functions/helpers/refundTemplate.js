const { mergeDeep } = require("./functions")

exports.createRefund = (billPayment, refund) => {
    // DONT FORGET TIMESTAMPS.CREATED
    /*
    refund = {
        
    }
    */

    let temp = mergeDeep(refundTemplate(), {
        is_test: billPayment.is_test,
        bill_id: billPayment.bill_id,
        restaurant_id: billPayment.restaurant_id,
        bill: billPayment.bill,
        restaurant: billPayment.restaurant,
        server: billPayment.server,
        analytics_helper: {
            day_id: billPayment.analytics_helper.day_id,
        },
        ...refund,
    })

    temp.timestamps.bill = bill.timestamps.created

    return temp
}

const refundTemplate = () => ({
    id: '',
    type: '', // ['cash', 'card'],
    bill_id: '',
    restaurant_id: '',
    user_id: '',
    bill_payment_ids: [],
    payment_intent_ids: [],

    bill: { id: '', code: '', number: '' },
    restaurant: { id: '', name: '' },
    server: { id: '', name: '' },
    user: { id: '', name: '' },

    is_test: false,
    status: '', // ['processing', 'failed', 'succeeded'],
    amount_requested: 0,
    total_refunded: 0,
    refunds: null,
    comment,
    timestamps: {
        bill,
        created,
    },
    analytics_helper: {
        day_id,
    }
})