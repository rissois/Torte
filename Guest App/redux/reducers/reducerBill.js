const billTemplate = {
    id: '',
    bill_number: 0,
    bill_code: 'XXXX',
    user_ids: [],
    restaurant: { id: '', name: '' },
    table: { id: '', name: '(loading)' },
    server: { id: '', name: '' },

    is_test: false,
    is_deleted: false,
    is_pickup_enabled: false,
    is_pay_enabled: false,
    is_order_enabled: false,

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
    },
    pay_status: {
        claim_all: {}
    },

    bill_item_status: {
        ordered: [],
        claimed: [],
        voided: [],
        paid: [],
    },

    coupons: [],
    promotions: [],

    outside_payments: [],
    refunded: {
        quantity: 0,
        total: 0,
    },
    voided: {
        subtotal: 0,
        tax: 0,
        bill_item_ids: []
        //quantity from bill_item_status
    },
    comped: {
        subtotal: 0,
        tax: 0,
        bill_item_ids: []
    },
    order_summary: {
        subtotal: 0,
        tax: 0,
        total: 0,
    },

    paid_summary: {
        subtotal: 0,
        tax: 0,
        total: 0,
        tips: 0,
        final: 0,
        discounts: 0,
    },

    paid_breakdown: {
        payments: {
            subtotal: 0,
            tax: 0,
            tips: 0, quantity: 0
        },
        charges: {
            subtotal: 0,
            tax: 0,
            tips: 0, quantity: 0
        },
        outside_payments: {
            quantity: 0,
            total: 0,
            tips: 0,
        },

        discounts_by_source: {
            torte: 0,
            restaurant: 0,
        },
        discounts_by_tax_appliance: {
            pre_tax: 0,
            post_tax: 0,
            value: 0,
        },
        discounts_by_object: {
            bill: 0,
            bill_item: 0
        },
        discounts_by_type: {
            promotion: 0,
            coupon: 0,
            loyalty: 0,
            // skip achievements
        }
    },

    feedback: {
        food: 0,
        food_responses: 0,
        service: 0,
        service_responses: 0,
        overall: 0,
        overall_responses: 0,
        comments: []
    },

    analytics_helper: {
        coupon_ids: [],
        promotion_ids: [],
        loyalty_ids: [],
        day_id: '',
        payment_zip_codes: [],
    },
}

const initialBill = {
    // ...oldInitialBill,
    bill: billTemplate,
    billItems: {},
    billGroups: {},
    billUsers: {},
    billType: '',
}


export default function bill(state = initialBill, action) {
    // Bill itself, as a doc, only uses bill/SET_BILL_CATEGORY
    switch (action.type) {
        case 'bill/SET_BILL_CATEGORY':
            return {
                ...state,
                [action.category]: action.data
            }
        case 'bill/UPDATE_BILL_CHILDREN':
            return {
                ...state,
                [action.category]: {
                    ...state[action.category],
                    ...action.obj,
                }
            }
        case 'bill/DELETE_BILL_CHILDREN':
            const category = { ...state[action.category] }
            Object.keys(action.obj).forEach(id => delete category[id])
            return { ...state, [action.category]: category }
        case 'bill/REMOVE_BILL':
        case 'app/RESET':
            return initialBill

        default:
            return state;
    }
}

