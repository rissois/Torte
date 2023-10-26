exports.dayTemplate = () => ({
    bill_ids: [],

    usage: {
        tables: 0,
        diners: 0,
        devices: {
            joined: 0,
            ordered: 0,
            paid: 0,
        },
    },

    order_summary: {
        // quantity: 0,
        // quantity_asap: 0,
        total: 0,
        tax: 0,
        subtotal: 0,
    },

    orders: {
        user: {
            quantity: 0,
            quantity_asap: 0,
            total: 0,
            tax: 0,
            subtotal: 0,
        },
        server: {
            quantity: 0,
            quantity_items: 0,
            total: 0,
            tax: 0,
            subtotal: 0,
        },
    },

    paid_summary: {
        subtotal: 0,
        tax: 0,
        discounts: 0,
        total: 0,
        tips: 0,
        final: 0,
    },

    voids: {
        subtotal: 0,
        tax: 0,
        quantity: 0,
    },
    comps: {
        subtotal: 0,
        tax: 0,
        percent: 0, // helpful for average
        quantity: 0,
    },

    refunds: {
        quantity: 0,
        total: 0,
        tip: 0,
    },

    payments: {
        app: {
            subtotal: 0,
            tax: 0,
            tips: 0,
            quantity: 0,
            unremitted: 0,
            free_quantity: 0,
        },
        charge: {
            subtotal: 0,
            tax: 0,
            tips: 0,
            fees: 0,
            quantity: 0,
        },
        cash: {
            total: 0,
            tips: 0,
            quantity: 0,
        },
        swipe: {
            total: 0,
            tips: 0,
            quantity: 0,
        },
        manual: {
            total: 0,
            tips: 0,
            quantity: 0,
        },
        outside: {
            total: 0,
            tips: 0,
            quantity: 0,
        },
    },
    discounts: {
        source: {
            torte: { quantity: 0, total: 0 },
            restaurant: { quantity: 0, total: 0 },
        },
        tax_appliance: {
            pre_tax: { quantity: 0, total: 0 },
            post_tax: { quantity: 0, total: 0 },
            value: { quantity: 0, total: 0 },
        },
        object: {
            bill: { quantity: 0, total: 0 },
            bill_item: { quantity: 0, total: 0 }
        },
        type: {
            promotion: { quantity: 0, total: 0 },
            coupon: { quantity: 0, total: 0 },
            loyalty: { quantity: 0, total: 0 },
            // skip achievements
        }
    },


    feedback: {
        food: 0,
        food_responses: 0,
        overall: 0,
        overall_responses: 0,
        service: 0,
        service_responses: 0,
        comments: 0,
        user_responses: 0,
    },
})
