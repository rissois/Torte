const { mergeDeep } = require("./functions")

exports.createBillUser = (bill, billUser) => {
    /*
        billUser: {
            id,
            name
        }
    */

    return mergeDeep(billUserTemplate(), {
        bill_id: bill.id,
        restaurant_id: bill.restaurant_id,
        ...billUser,
    })
}

const billUserTemplate = () => ({
    id: '',
    name: '',
    bill_id: '',
    restaurant_id: '',

    order_summary: { subtotal: 0, tax: 0, total: 0, bill_group_ids: [] },

    claim_summary: { subtotal: 0, tax: 0, total: 0, overage: 0, bill_item_ids: [] },

    paid_summary: { subtotal: 0, tax: 0, total: 0, tips: 0, final: 0, discounts: 0, fees: 0, unremitted: 0, bill_item_ids: [], },

    payments: {}, // DO NOT NEED TO PRE-FILL (see DayTemplate)
    discounts: {}, // DO NOT NEED TO PRE-FILL (see DayTemplate)
    voids: { subtotal: 0, tax: 0, bill_item_ids: [], },
    comps: { subtotal: 0, tax: 0, percent: 0, bill_item_ids: [], },
    refunds: { total: 0, tip: 0, bill_refund_ids: [] },

    feedback: null,
    // {
    //     food: 0,
    //     service: 0,
    //     overall: 0,
    //     comment: ''
    // },

    analytics_helper: {
        coupon_ids: [],
        bill_payment_ids: [],
    },
})