const { mergeDeep } = require("./functions")

exports.createCoupon = coupon => {
    return mergeDeep(couponTemplate(), coupon)
}

const couponTemplate = () => ({
    id: '',
    is_test: false,

    // Amount is either a single value or a percentage
    value: 0,
    percent: {
        percent: 0,
        max: 0,
        min_purchase: 0,
        is_pre_tax: false,
    },

    banner: '', // First thing they see
    header: '', // Main coupon information
    text: [], // Added text
    conditions: [], // ['non-refundable']
    is_torte_issued: false,

    user_id: '',
    is_new: true,

    applied: 0, // amount applied
    bill_id: '',
    restaurant: { id: '', name: '' },
    bill_payment_id: '',

    transfer: null, // stripe object for Torte transfer to restaurant

    timestamps: {
        created: null,
        expiration: null,
        used: null,
        transfer: null,
    },
})
