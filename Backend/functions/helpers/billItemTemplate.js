exports.createBillItem = (
    billGroup,
    subtotal,
    tax,
    tax_rate,
    bill_order_id,
    printer_id
) => {
    return {
        id: '',
        timestamps: {
            created: null,
            closed: null,
            printed: null,
            marked: null,
        },
        custom: [],
        voided: {
            is_voided: false,
            server_id: '',
            manager_id: '',
        },
        comped: {
            is_comped: false,
            subtotal: 0,
            tax: 0,
            percent: 0,
        },

        // Information calculated on order
        tax_rate,
        summary: { subtotal, tax, total: subtotal + tax, },
        printer_id,
        units: {
            denom: 1,
            available: [{ subtotal, tax, overage: 0 }],
            claimed: {},
            paid: {},
            charged: {},
            precharged: {},
        },

        // Information carried from billGroup
        bill_id: billGroup.bill_id,
        restaurant_id: billGroup.restaurant_id,
        table_id: billGroup.table_id,
        user_id: billGroup.user_id,
        name: billGroup.name,
        position: billGroup.position,
        course: billGroup.course,
        size: billGroup.size,
        filters: billGroup.filters,
        modifiers: billGroup.modifiers,
        upsells: billGroup.upsells,
        captions: billGroup.captions,
        comment: billGroup.comment,
        analytics_helper: billGroup.analytics_helper,
        reference_ids: {
            ...billGroup.reference_ids,
            bill_group_id: billGroup.id,
            bill_order_id,
        },
    }
}

exports.createChargeCorrectionItem = (bill, subtotal, tax, user_id) => {
    return {
        id: '',
        restaurant_id: bill.restaurant_id,
        bill_id: bill.id,
        user_id,
        table_id: bill.table.id,

        reference_ids: {
            dotw_id: '',
            hour_id: '',
            meal_id: '',
            menu_id: '',
            section_id: '',
            panel_id: '',
            item_id: 'custom',
            variant_id: '',
            bill_group_id: '',
            bill_order_id: '',
        },

        name: 'Outside payment correction',
        position: '99999999999',
        course: '',
        size: {
            name: '',
            price: subtotal,
            code: '',
        },

        tax_rate: {
            id: '',
            name: '',
            percent: 0,
        },
        summary: { subtotal: subtotal, tax: tax, total: subtotal + tax, },

        filters: {},
        modifiers: {},
        upsells: [],
        captions: { size: '', modifiers: '', filters: '', upsells: '', custom: '', one_line: '', line_break: '' },
        comment: '',

        timestamps: {
            created: null,
            closed: null,
            printed: null,
            marked: null,
        },

        units: {
            denom: 1,
            available: [],
            claimed: {},
            paid: {},
            precharged: { [user_id]: [{ subtotal, tax, overage: 0 }] },
            charged: {},
        },

        custom: [],
        voided: {
            is_voided: false,
            server_id: '',
            manager_id: '',
        },
        comped: {
            is_comped: false,
            subtotal: 0,
            tax: 0,
            percent: 0,
        },

        printer_id: '',
        analytics_helper: {
            modifier_ids: [],
            mod_item_ids: [],
            mod_option_ids: [],
            mod_variant_ids: [],
            upsell_item_ids: [],
            upsell_option_ids: [],
            upsell_variant_ids: [],
            filter_ids: [],
            is_panel_click: false,
            paid_user_ids: [],
            promotion_ids: [],
        }
    }
}

// const billItemTemplate = {
//     id: '',
//     restaurant_id: '',
//     bill_id: '',
//     user_id: '',
//     table_id: '',

//     reference_ids: {
//         dotw_id: '',
//         hour_id: '',
//         meal_id: '',
//         menu_id: '',
//         section_id: '',
//         panel_id: '',
//         item_id: '',
//         variant_id: '',
//         bill_group_id: '',
//         bill_order_id: '',
//     },

//     name: '',
//     position: '',
//     course: '',
//     size: {
//         name: '',
//         price: 0,
//         code: '',
//     },

//     tax_rate: {},
//     summary: { subtotal: 0, tax: 0, total: 0, },

//     filters: {},
//     modifiers: {},
//     upsells: [],
//     captions: { size: '', modifiers: '', filters: '', upsells: '', custom: '', one_line: '', line_break: '' },
//     comment: '',

//     timestamps: {
//         created: null,
//         closed: null,
//         printed: null,
//         marked: null,
//     },

//     units: {
//         denom: 1,
//         available: [],
//         claimed: {},
//         paid: {},
//         charged: {},
//     },

//     custom: [],
//     voided: {
//         is_voided: false,
//         server_id: '',
//         manager_id: '',
//     },
//     comped: {
//         is_comped: false,
//         subtotal: 0,
//         tax: 0,
//         percent: 0,
//     },

//     printer_id: '',
//     analytics_helper: {
//         modifier_ids: [],
//         mod_item_ids: [],
//         mod_option_ids: [],
//         mod_variant_ids: [],
//         upsell_item_ids: [],
//         upsell_option_ids: [],
//         upsell_variant_ids: [],
//         filter_ids: [],
//         is_panel_click: false,
//         paid_user_ids: [],
//         promotion_ids: [],
//     }
// }