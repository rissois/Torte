const { mergeDeep } = require("./functions")

exports.createPayment = (bill, payment) => {
    // DONT FORGET TIMESTAMPS.CREATED
    /*
    I dont know the best way to do this... but this will suffice
    payment = {
        id,
        type,
        status,
        user_id,
        user: {id, name},
        payment_intent,
        line_items,
        coupons,
        tendered,
        comment,
        summary,
        analytics_helper: {bill_item_ids, coupon_ids}
    }
    */

    let temp = mergeDeep(paymentTemplate(), {
        is_test: bill.is_test,
        bill_id: bill.id,
        restaurant_id: bill.restaurant_id,
        bill: {
            id: bill.id, code: bill.bill_code, number: bill.bill_number,
        },
        restaurant: bill.restaurant,
        server: bill.server,

        ...payment,

        analytics_helper: {
            day_id: bill.analytics_helper.day_id,
            ...(payment.analytics_helper || {})
        },
    })

    // Timestamps does not work well with mergeDeep
    temp.timestamps.bill = bill.timestamps.created
    temp.analytics_helper.day_created = bill.analytics_helper.day_created

    return temp
}

const paymentTemplate = exports.paymentTemplate = () => ({
    id: '',
    type: '',  // ['app', 'charge', 'swipe', 'manual', 'cash', 'outside'],
    status: 'processing', // ['processing', 'failed', 'succeeded'],
    is_test: '',
    is_deleted: false,

    bill_id: '',
    restaurant_id: '',
    user_id: '',
    bill: { id: '', code: '', number: '' },
    restaurant: { id: '', name: '' },
    server: { id: '', name: '' },
    user: { id: '', name: '' },
    payment_intent: null,

    line_items: [],
    coupons: [],

    // CASH
    tendered: 0,

    // POS
    comment: '',

    summary: {
        subtotal: 0,
        tax: 0,
        discounts: 0,
        total: 0,
        tip: 0,
        final: 0,
        unremitted: 0,
    },

    refunds: {
        total: 0,
        tip: 0,
        bill_refund_ids: [],
    },

    timestamps: {
        bill: null,
        created: null,
    },
    analytics_helper: {
        bill_item_ids: [],
        coupon_ids: [],
        day_id: '',
        day_created: null,
    },
})