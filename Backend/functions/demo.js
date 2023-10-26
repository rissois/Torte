/* eslint-disable no-await-in-loop */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

const { dateToString } = require('./helpers/functions');
const { createBillItem } = require('./helpers/billItemTemplate');
const { createBillUser } = require('./helpers/billUserTemplate');
const { createBill } = require('./helpers/billTemplate');
const { getSnapshotData, reportErrors } = require('./helpers/callableFns');

const restaurant_id = 'K00IXKl5xiNmsTBYro0dRSK8gtA3'

const BILL_CODE_RANGE = 9999


const createItems = (transaction, bill, billRef, user_id, user) => {
    const isServer = user_id === 'server';

    (isServer ? SERVER_ITEMS : USER_ITEMS).forEach(item => {
        const { subtotal, tax } = item.summary;
        const total = subtotal + tax;

        const itemRef = billRef.collection('BillItems').doc()

        const billItem = createBillItem(
            { ...item, user_id, bill_id: bill.id, table_id: bill.table.id, id: 'bill_group_id' },
            subtotal,
            tax,
            item.tax_rate,
            'bill_order_id',
            ''
        )

        // Fill in non-BillGroup fields
        billItem.id = itemRef.id
        billItem.timestamps.created = admin.firestore.Timestamp.now()
        billItem.timestamps.printed = admin.firestore.Timestamp.now()
        billItem.analytics_helper.day_id = bill.analytics_helper.day_id
        billItem.analytics_helper.day_created = bill.analytics_helper.day_created
        billItem.tax_rate = item.tax_rate
        if (item.custom) billItem.custom = item.custom


        // Add item values to the bill / user
        bill.bill_item_status.ordered.push(itemRef.id)
        bill.order_summary.subtotal += subtotal
        bill.order_summary.tax += tax
        bill.order_summary.total += total
        if (!bill.orders[isServer ? 'server' : 'user']) {
            bill.orders[isServer ? 'server' : 'user'] = { subtotal: 0, tax: 0, total: 0 }
        }
        bill.orders[isServer ? 'server' : 'user'].subtotal += subtotal
        bill.orders[isServer ? 'server' : 'user'].tax += tax
        bill.orders[isServer ? 'server' : 'user'].total += total

        if (!isServer) {
            bill.user_status[user_id].order_total += total
            user.order_summary.subtotal += subtotal
            user.order_summary.tax += tax
            user.order_summary.total += total
        }

        transaction.set(itemRef, billItem)
        transaction.set(billRef.collection('BillItemAnalytics').doc(itemRef.id), billItem)
    })

}

/**
 * Create a bill pre-filled with existing order information
 * 
 * @param {String} table_id (optional) ID for the table to create this bill
 * @param {String} name (optional) name of user
 * @param {Boolean} isWithUserOrder (requires name) whether the user has already ordered items
 * @param {Boolean} isWithServerOrder whether the server has added items
 */
exports.createDemoBill = functions.https.onCall(async (data, context) => {
    const is_admin = context.auth && context.auth.token.is_admin
    const user_id = context.auth && context.auth.uid;

    // Temporarily disabling because frequently losing anonymous accounts for web testing
    // if (user_id !== restaurant_id && !is_admin) throw new functions.https.HttpsError('permission-denied', 'You do not have permission to create a bill.')

    let {
        table_id,
        name: user_name,
        isWithUserOrder,
        isWithServerOrder,
    } = data

    const restaurantRef = admin.firestore().collection('Restaurants').doc(restaurant_id)

    return admin.firestore().runTransaction(async transaction => {
        const restaurant = await getSnapshotData(restaurantRef, transaction)

        // Get either the specified table or a random table
        const randomID = (admin.firestore().collection('Random').doc()).id
        const table = table_id ?
            // get defined table
            await getSnapshotData(restaurantRef.collection('Tables').doc(table_id), transaction) :
            // get a random table
            (await restaurantRef.collection('Tables').where('id', '>=', randomID).limit(1).get()).docs[0].data()

        // if randomID failed, get the first table
        if (!table) (await restaurantRef.collection('Tables').where('id', '>=', '').limit(1).get()).docs[0].data()

        // A LOT OF WHAT FOLLOWS IS COPIED FROM BILL2
        const is_test = true
        const automatic_gratuity_percent = restaurant.gratuities.automatic.default_option

        const billCountRef = restaurantRef.collection('Counts').doc('BillCount')
        const { [is_test ? 'bill_count_test' : 'bill_count']: bill_count } = await getSnapshotData(billCountRef, transaction)

        const daysQuerySnapshot = await restaurantRef
            .collection('Days')
            .where('is_test', '==', is_test)
            .where('timestamps.created', '<=', admin.firestore.Timestamp.fromMillis(Date.now()))
            .orderBy('timestamps.created', 'desc')
            .limit(1)
            .get()

        if (!daysQuerySnapshot.size) throw new functions.https.HttpsError('not-found', 'Restaurant records are not properly set up.')
        const daySnapshot = daysQuerySnapshot.docs[0]

        const billRef = restaurantRef.collection('Bills').doc()

        let bill_code = null
        let randomBillNumber = Math.ceil(Math.random() * BILL_CODE_RANGE)

        while (!bill_code) {
            const randomBillCode = randomBillNumber.toString().padStart(4, '0')

            const billsQuerySnapshot = await restaurantRef.collection('Bills')
                .where('bill_code', '==', randomBillCode)
                .where('timestamps.closed', '!=', null)
                // .orderBy('timestamps.closed', 'desc')
                .limit(1)
                .get()

            if (billsQuerySnapshot.empty) {
                bill_code = randomBillCode
            }
            else {
                // Can test bill based on closed time and table and still use bill_code
                randomBillNumber++
                if (randomBillNumber > 9999) {
                    randomBillNumber = 1
                }
            }
        }


        /* -----------------------
            Create bill and add user
        ----------------------- */

        let bill = createBill({
            id: billRef.id,
            restaurant_id: restaurantRef.id,
            bill_number: bill_count + 1,
            bill_code,
            restaurant: table.restaurant,
            table: { id: table.id, name: table.name, code: table.code },
            analytics_helper: {
                day_id: daySnapshot.id,
                day_created: daySnapshot.data().timestamps.created || null,
            },
            gratuities: { percent: automatic_gratuity_percent },
            is_test,
            ...user_name && {
                user_ids: [user_id],
                user_status: { [user_id]: { order_total: 0, paid_total: 0, number_of_payments: 0, name: user_name } },
            },
        })

        bill.timestamps.created = admin.firestore.Timestamp.now()

        if (isWithServerOrder) createItems(transaction, bill, billRef, 'server')

        let user = user_name ? createBillUser(bill, { id: user_id, name: user_name }) : null
        if (isWithUserOrder) createItems(transaction, bill, billRef, user_id, user)

        transaction.set(billRef, bill)

        if (user_name) {
            transaction.set(
                billRef.collection('BillUsers').doc(user_id),
                user,
            )

            transaction.update(
                admin.firestore().collection('UsersPOS').doc(user_id),
                {
                    'torte.open_bills': admin.firestore.FieldValue.arrayUnion({
                        bill_id: bill.id,
                        restaurant: table.restaurant,
                        date: dateToString(bill.timestamps.created.toDate()), // cannot use serverTimestamp in array :(, and Timestamp.now is not reproducible
                    })
                }
            )
        }

        transaction.update(
            billCountRef,
            { [is_test ? 'bill_count_test' : 'bill_count']: admin.firestore.FieldValue.increment(1) }
        )

        transaction.set(daySnapshot.ref, {
            bill_ids: admin.firestore.FieldValue.arrayUnion(bill.id),
            usage: {
                devices: {
                    joined: admin.firestore.FieldValue.increment(1)
                },
                tables: admin.firestore.FieldValue.increment(1)
            }
        }, { merge: true })

        return { bill, created: true }
    })
        .catch(reportErrors('demo', 'createDemoBill'))
})


const USER_ITEMS = [
    {
        name: 'JERK CHICKEN WINGS',
        filters: {},
        restaurant_id,
        table_id: '',
        id: '',
        position: '10000000002',
        upsells: [],
        comment: '',
        user_id: '',
        modifiers: {
            jYOPgXcwlYoTsSpgM6IX: {
                index: 0,
                modifier_id: 'jYOPgXcwlYoTsSpgM6IX',
                name: 'sauces',
                modifier_first_free: 1,
                mods: [{
                    name: 'Regular',
                    price: 0,
                    item_id: '',
                    quantity: 1,
                    option_id: 'ot9YuTbw1sXG9Ro77LOf',
                    variant_id: '',
                    index: 0
                },
                {
                    index: 1,
                    quantity: 1,
                    item_id: '',
                    variant_id: '',
                    name: 'Lemon pepper',
                    price: 100,
                    option_id: 'NcHEl89v8br0CNNU8f0E'
                }]
            }
        },
        summary: { tax: 77, subtotal: 1100, total: 1177 },
        tax_rate: { id: 'x7QmaM6BXiMJM6B8rPAB', name: 'Food', percent: 7 },
        course: 'starter',
        printer_id: 'DkJHtozftS4yTAEXzwDN',
        bill_id: 'Vxr3q5zu8eRZu9yyLxnJ',
        size: { code: '16', price: 1100, name: '16 wings' },
        captions: {
            custom: '',
            filters: '',
            one_line: '16 WINGS / SAUCES: Regular and Lemon pepper',
            upsells: '',
            modifiers: 'SAUCES: Regular and Lemon pepper',
            line_break: '16 WINGS\nSAUCES: Regular and Lemon pepper',
            size: '16 wings'
        },
        analytics_helper: {
            modifier_ids: ['jYOPgXcwlYoTsSpgM6IX'],
            mod_ids: ['ot9YuTbw1sXG9Ro77LOf', 'NcHEl89v8br0CNNU8f0E'],
            day_created: null,
            mod_item_ids: [],
            upsell_option_ids: [],
            is_panel_click: false,
            filter_ids: [],
            upsell_item_ids: [],
            day_id: '',
            upsell_ids: [],
            mod_option_ids: ['ot9YuTbw1sXG9Ro77LOf', 'NcHEl89v8br0CNNU8f0E']
        },
        reference_ids: {
            section_id: 'nkZK2Ixr06QPBvr5nKbB',
            period_id: 'i1u2houinJKHJKA',
            menu_id: 'menu_2',
            dotw_id: 1,
            meal_id: 'j7RA7EPMBgDTiTBs8HAG',
            variant_id: '',
            item_id: '21CfnGvgPN1FPRBl0Onp',
            bill_group_id: '6tLwgvCiO1sKm2XMFxA1',
            bill_order_id: '04B6sAfKfPMw65RhZfsP',
            panel_id: ''
        },
    },
    {
        captions: {
            modifiers: '',
            line_break: '',
            upsells: '',
            size: '',
            filters: '',
            one_line: '',
            custom: ''
        },
        restaurant_id,
        name: 'BEAST OF BOURBON',
        user_id: '',
        size: { name: '', code: '', price: 1400 },
        timestamps: {
            created: null,
            marked: null,
            printed: null,
            closed: null
        },
        printer_id: '',
        table_id: '',
        course: 'ASAP',
        id: '',
        reference_ids: {
            menu_id: 'menu_3',
            bill_order_id: '04B6sAfKfPMw65RhZfsP',
            bill_group_id: 'JUAVHO5B0Ne7WWSEzYHE',
            section_id: '4tZzx1fXtgtUyFDo54oI',
            variant_id: '',
            dotw_id: 1,
            period_id: 'i1u2houinJKHJKA',
            item_id: 'p62zIPE0RrgzhMfhLDb1',
            meal_id: 'j7RA7EPMBgDTiTBs8HAG',
            panel_id: ''
        },
        summary: { tax: 98, total: 1498, subtotal: 1400 },
        comment: '',
        analytics_helper: {
            is_panel_click: false,
            day_created: null,
            mod_item_ids: [],
            mod_ids: [],
            upsell_item_ids: [],
            mod_option_ids: [],
            upsell_option_ids: [],
            day_id: '',
            upsell_ids: [],
            filter_ids: [],
            modifier_ids: []
        },
        modifiers: {},
        filters: {},
        position: '10000010002',
        tax_rate: { id: 'LCQ6cC04QLhC6Z757fm2', name: 'Drink', percent: 7 },
        upsells: [],
        bill_id: ''
    }
]

const SERVER_ITEMS = [
    {
        name: 'BURGER',
        modifiers: {},
        size: { name: '', price: 1500, code: '' },
        position: '99999990402',
        printer_id: '',
        comment: '',
        filters: { gluten_free: 100 },
        captions: {
            custom: 'Extra bacon ($1.00)',
            one_line: 'GLUTEN-FREE / Extra bacon ($1.00)',
            filters: 'GLUTEN-FREE',
            upsells: '',
            line_break: 'GLUTEN-FREE\nExtra bacon ($1.00)',
            comped: '',
            size: '',
            modifiers: ''
        },
        table_id: '',
        restaurant_id,
        upsells: [],
        timestamps: {
            marked: null,
            closed: null,
            created: null,
            printed: null,
        },
        summary: { subtotal: 1700, total: 1819, tax: 119 },
        tax_rate: { id: 'x7QmaM6BXiMJM6B8rPAB', name: 'Food', percent: 7 },
        custom: [{ name: 'Extra bacon', price: 100 }],
        course: 'main',
        id: '',
        bill_id: '',
        reference_ids: {
            section_id: 'FrRvay0VYeFCMgJcRy0A',
            period_id: '',
            dotw_id: '',
            menu_id: 'menu_2',
            panel_id: '',
            meal_id: '',
            variant_id: '',
            item_id: 'HJnqHFnq72it2eZ72h0P'
        },
        analytics_helper: {
            day_id: '',
            day_created: null,
            mod_option_ids: [],
            upsell_item_ids: [],
            filter_ids: ['gluten_free'],
            upsell_ids: [],
            mod_item_ids: [],
            mod_ids: [],
            modifier_ids: [],
            upsell_option_ids: [],
            is_panel_click: false
        },
        user_id: 'server',
    },
    {
        printer_id: '',
        bill_id: '',
        analytics_helper: {
            mod_option_ids: [],
            day_created: null,
            mod_item_ids: [],
            upsell_option_ids: ['zsaTmLXaXBGVMn972bmY'],
            modifier_ids: [],
            day_id: '',
            upsell_item_ids: [],
            upsell_ids: ['zsaTmLXaXBGVMn972bmY'],
            mod_ids: [],
            is_panel_click: false,
            filter_ids: []
        },
        captions: {
            one_line: 'Egg',
            comped: '',
            size: '',
            custom: '',
            line_break: 'Egg',
            modifiers: '',
            upsells: 'Egg',
            filters: ''
        },
        tax_rate: { percent: 7, id: 'x7QmaM6BXiMJM6B8rPAB', name: 'Food' },
        filters: {},
        name: 'KIMCHI FRIED RICE',
        size: { name: '', price: 1300, code: '' },
        upsells: [
            {
                price: 200,
                option_id: 'zsaTmLXaXBGVMn972bmY',
                name: 'Egg',
                index: 0,
                upsell_first_free: 1,
                item_id: '',
                quantity: 1,
                variant_id: ''
            }
        ],
        position: '99999990303',
        timestamps: {
            marked: null,
            created: null,
            closed: null,
            printed: null,
        },
        reference_ids: {
            item_id: 'Y7VlZ7tpMD3ll5k1ovRh',
            period_id: '',
            panel_id: '',
            dotw_id: '',
            variant_id: '',
            meal_id: '',
            menu_id: 'menu_2',
            section_id: 'vuUzBuDFniU8KsETxPSV'
        },
        restaurant_id,
        summary: { tax: 91, subtotal: 1300, total: 1391 },
        course: 'main',
        id: '',
        user_id: 'server',
        modifiers: {},
        table_id: '',
        comment: ''
    },

]


