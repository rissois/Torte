import firebase from "firebase";
import { selectionsToCaptions } from "../../utils/functions/summarizeSelections";
import { createBillItemAnalytics } from "../../utils/functions/analyticsHelpers";
import { singleSubtotal } from "../../utils/functions/singleSubtotal";

const handleOrderFields = (subtotal, tax) => ({
    subtotal: firebase.firestore.FieldValue.increment(subtotal),
    tax: firebase.firestore.FieldValue.increment(tax),
    total: firebase.firestore.FieldValue.increment(subtotal + tax),
})

const handleCompedFields = (bill_item_id, oldComped = { subtotal: 0, tax: 0 }, newComped = { subtotal: 0, tax: 0 }) => ({
    subtotal: firebase.firestore.FieldValue.increment(newComped.subtotal - oldComped.subtotal),
    tax: firebase.firestore.FieldValue.increment(newComped.tax - oldComped.tax),
    ...newComped.subtotal ? { bill_item_id: firebase.firestore.FieldValue.arrayUnion(bill_item_id) } :
        oldComped.subtotal && { bill_item_id: firebase.firestore.FieldValue.arrayRemove(bill_item_id) },
})

export const compRemainder = (transaction, bill, billRef, expectedSubtotal, expectedTax, isClosingBill) => {

    const { restaurant_id, id: bill_id, order_summary, paid_summary, analytics_helper: { day_created, day_id } } = bill

    console.log('Comp remainder: ', expectedSubtotal < order_summary.subtotal - paid_summary.subtotal, expectedTax < order_summary.tax - paid_summary.tax, expectedSubtotal, order_summary.subtotal - paid_summary.subtotal, expectedTax, order_summary.tax - paid_summary.tax)
    if (expectedSubtotal > order_summary.subtotal - paid_summary.subtotal || expectedTax > order_summary.tax - paid_summary.tax) throw 'Comp remainder is not what was approved'

    const size = { name: '', code: '', price: 0 }
    const modifiers = {}
    const upsells = []
    const filters = {}
    const custom = []
    const comped = {
        is_comped: false,
        subtotal: expectedSubtotal,
        percent: 0,
        tax: expectedTax, // REMEMBER:restaurant is still charged tax on comps
    }
    const subtotal = -expectedSubtotal
    const tax = -expectedTax

    const captions = selectionsToCaptions({ size, modifiers, upsells, filters, custom, comped })
    const billItemRef = billRef.collection('BillItems').doc()

    const newBillItem = {
        id: billItemRef.id,
        restaurant_id,
        bill_id,
        table_id: bill.table.id,
        user_id: 'server',
        reference_ids: { dotw_id: '', period_id: '', meal_id: '', menu_id: '', section_id: '', panel_id: '', item_id: 'custom', variant_id: '', },
        name: 'COMP BILL',
        position: 'comp',
        course: 'ASAP',
        size,
        comped,
        tax_rate: { id: 'none', name: '', percent: 0 },
        summary: {
            subtotal,
            tax,
            total: subtotal + tax,
        },
        filters,
        modifiers,
        upsells,
        custom,
        captions,
        analytics_helper: createBillItemAnalytics({ filters, modifiers, upsells, }, day_id, day_created, false),
        comment: '',
        units: {
            denom: 1,
            available: [{ subtotal, tax, overage: 0 }],
            claimed: {},
            paid: {},
        },
        printer_id: '',
        voided: {
            is_voided: false,
            server_id: '',
            manager_id: '',
        },
        timestamps: {
            created: firebase.firestore.FieldValue.serverTimestamp(),
            closed: isClosingBill ? firebase.firestore.FieldValue.serverTimestamp() : null,
            printed: null,
            marked: firebase.firestore.FieldValue.serverTimestamp(),
        },
    }

    transaction.set(billRef.collection('BillItems').doc(billItemRef.id), newBillItem, { merge: true })
    transaction.set(billRef.collection('BillItemAnalytics').doc(billItemRef.id), newBillItem, { merge: true })

    transaction.set(billRef, {
        bill_item_status: { ordered: firebase.firestore.FieldValue.arrayUnion(billItemRef.id) },
        order_summary: handleOrderFields(subtotal, tax,),
        orders: {
            server: handleOrderFields(subtotal, tax,),
        },
        comps: handleCompedFields(billItemRef.id, undefined, comped),
    }, { merge: true })
}

// Create item with size: {price: 0}, comped: {subtotal: unvoidedSubtotal, tax: 0}
// Which should make item.subtotal = -unvoidedSubtotal 
// which will reduce the DayRef ordered, and throw the rest into comp, without affecting the actual item

export const transactCompRemainder = (
    restaurantRef,
    bill_id,
    expectedSubtotal,
    expectedTax,
    isClosingBill,
) => {
    const billRef = restaurantRef.collection('Bills').doc(bill_id)

    return firebase.firestore().runTransaction(async transaction => {
        const bill = (await transaction.get(billRef)).data()
        if (!bill) throw 'Cannot find bill, this should not happen...'
        if (bill.timestamps.closed) throw 'This bill was already closed'

        compRemainder(transaction, bill, billRef, expectedSubtotal, expectedTax, isClosingBill)

        if (isClosingBill) {
            const { bill_item_status: { paid, claimed, ordered, voided, deleted, void_all } } = bill;

            transaction.set(billRef, {
                timestamps: {
                    closed: firebase.firestore.FieldValue.serverTimestamp(),
                },
            }, { merge: true });

            [...paid, ...claimed, ...ordered, ...voided, ...deleted].forEach(bill_item_id => {
                transaction.set(billRef.collection('BillItems').doc(bill_item_id), {
                    timestamps: { closed: firebase.firestore.FieldValue.serverTimestamp(), }
                }, { merge: true })
            })
        }

        return !!bill.user_ids.length

    })
}