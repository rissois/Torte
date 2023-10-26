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

// Option to create item with size: {price: 0}, comped: {subtotal: unvoidedSubtotal, tax: 0}
// Which should make item.subtotal = -unvoidedSubtotal 
// which will reduce the DayRef ordered, and throw the rest into comp, without affecting the actual item

export const transactComp = (
    restaurantRef,
    bill_id,
    compChanges // {[bill_item_id]: {subtotal, percent}}
) => {
    const billRef = restaurantRef.collection('Bills').doc(bill_id)

    return firebase.firestore().runTransaction(async transaction => {
        const restaurant = (await transaction.get(restaurantRef)).data()
        if (!restaurant) throw 'Cannot find restaurant, this is unusual...'
        const bill = (await transaction.get(billRef)).data()
        if (!bill) throw 'Cannot find bill, this should not happen...'
        if (bill.timestamps.closed) throw 'This bill was already closed'

        const { day_id, day_created, } = bill.analytics_helper

        let failedToComp = 0

        const billItemDocs = await Promise.all(Object.keys(compChanges).map(bill_item_id => transaction.get(billRef.collection('BillItems').doc(bill_item_id))))

        billItemDocs.forEach(doc => {
            const billItem = doc.data()
            if (billItem.voided.is_voided || billItem.timestamps.closed || billItem.units.denom > 1) return failedToComp++
            // make sure not voided or closed or split
            let comped = compChanges[doc.id]

            const subtotal = singleSubtotal({ ...billItem, comped })
            comped.is_comped = !!comped.subtotal

            const taxPercent = billItem.tax_rate.percent
            comped.tax = Math.round(comped.subtotal * taxPercent / 100)
            // Most accurate, even if overkill for IRS
            const tax = Math.round((subtotal + comped.subtotal) * taxPercent / 100) - comped.tax
            const captions = selectionsToCaptions({ ...billItem, comped })

            const compedBillItem = {
                comped,
                summary: {
                    subtotal,
                    tax,
                    total: subtotal + tax,
                },
                captions,
                units: {
                    denom: 1,
                    available: [{ subtotal, tax, overage: 0 }],
                    claimed: {},
                    paid: {},
                },
            }

            transaction.set(doc.ref, compedBillItem, { merge: true })
            transaction.set(billRef.collection('BillItemAnalytics').doc(doc.id), compedBillItem, { merge: true })

            const deltaSubtotal = subtotal - billItem.summary.subtotal
            const deltaTax = tax - billItem.summary.tax

            transaction.set(billRef, {
                order_summary: handleOrderFields(deltaSubtotal, deltaTax,),
                orders: {
                    [billItem.user_id === 'server' ? 'server' : 'user']: handleOrderFields(deltaSubtotal, deltaTax,),
                },
                comps: handleCompedFields(doc.id, billItem.comped, comped),
            }, { merge: true })
        })
        return failedToComp
    })
}