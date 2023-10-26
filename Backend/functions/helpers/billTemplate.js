const { mergeDeep } = require("./functions")

exports.createBill = bill => {
    return mergeDeep(billTemplate(), bill)
}

const billTemplate = () => ({
    id: '',
    restaurant_id: '',
    bill_number: 0,
    bill_code: '',
    user_ids: [],
    user_status: {},
    restaurant: { id: '', name: '' },
    table: { id: '', name: '' },
    server: { id: '', name: '' },

    is_test: false,
    is_deleted: false,
    is_pay_enabled: true,
    is_pickup_enabled: false,
    is_order_enabled: true,

    timestamps: {
        created: null,
        closed: null,
        unpaid: null,
        charged: null,
    },

    party: {
        party_size: null,
        is_repeat_party_size: false
    },
    gratuities: {
        is_automatic_gratuity_on: false,
        percent: 0,
    },

    cart_status: {
        bill_group_ids: [],
    },
    order_status: {
        bill_order_id: '',
        user_ids: [],
    },
    pay_status: {
        claim_all: {}
    },

    bill_item_status: {
        ordered: [],
        claimed: [],
        paid: [],
        voided: [],
        deleted: [],
        void_all: [],
    },

    coupons: [],

    order_summary: {
        subtotal: 0,
        tax: 0,
        total: 0,
    },
    orders: {}, // DO NOT NEED TO PRE-FILL (see DayTemplate)

    paid_summary: {
        subtotal: 0,
        tax: 0,
        discounts: 0,
        total: 0,
        tips: 0,
        final: 0,
        fees: 0,
        unremitted: 0,
    },

    payments: {}, // DO NOT NEED TO PRE-FILL (see DayTemplate)
    discounts: {}, // DO NOT NEED TO PRE-FILL (see DayTemplate)
    voids: { subtotal: 0, tax: 0, },
    comps: { subtotal: 0, tax: 0, percent: 0, bill_item_ids: [], },
    refunds: { total: 0, tip: 0, bill_refund_ids: [] },

    feedback: {
        food: 0,
        food_responses: 0,
        service: 0,
        service_responses: 0,
        overall: 0,
        overall_responses: 0,
        user_responses: 0,
        comments: []
    },

    analytics_helper: {
        coupon_ids: [],
        day_id: '',
        day_created: null,
        payment_zip_codes: [],
    },
})
