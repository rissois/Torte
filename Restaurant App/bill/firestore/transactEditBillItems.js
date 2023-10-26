import firebase from "firebase";
import { selectionsToCaptions } from "../../utils/functions/summarizeSelections";
import { createBillItemAnalytics } from "../../utils/functions/analyticsHelpers";
import { singleSubtotal } from "../../utils/functions/singleSubtotal";

/*
    DO YOU WANT TO TURN THIS INTO A SERVER ORDER? doesn't quite make sense
*/

const handleOrderFields = (subtotal, tax) => ({
    subtotal: firebase.firestore.FieldValue.increment(subtotal),
    tax: firebase.firestore.FieldValue.increment(tax),
    total: firebase.firestore.FieldValue.increment(subtotal + tax),
})

const handleVoidedFields = (subtotal, tax,) => ({
    subtotal: firebase.firestore.FieldValue.increment(subtotal),
    tax: firebase.firestore.FieldValue.increment(tax),
})

const handleCompedFields = (bill_item_id, oldComped = { subtotal: 0, tax: 0 }, newComped = { subtotal: 0, tax: 0 }) => ({
    subtotal: firebase.firestore.FieldValue.increment(newComped.subtotal - oldComped.subtotal),
    tax: firebase.firestore.FieldValue.increment(newComped.tax - oldComped.tax),
    ...newComped.subtotal ? { bill_item_id: firebase.firestore.FieldValue.arrayUnion(bill_item_id) } :
        oldComped.subtotal && { bill_item_id: firebase.firestore.FieldValue.arrayRemove(bill_item_id) },
})

export const transactEditBillItem = (
    restaurantRef,
    bill_id,
    item_id,
    variant_id,
    { add = [], edit = [], remove = [], unvoid = [] }, // documentChanges
    { comped = { subtotal: 0, tax: 0, }, size, filters, upsells, modifiers, custom, reference_ids, position, tax_rate_id, name, printer_id }, // itemChanges
    isOrder
) => {
    const billRef = restaurantRef.collection('Bills').doc(bill_id)

    return firebase.firestore().runTransaction(async transaction => {
        const restaurant = (await transaction.get(restaurantRef)).data()
        if (!restaurant) throw 'Cannot find restaurant, this is unusual...'
        const bill = (await transaction.get(billRef)).data()
        if (!bill) throw 'Cannot find bill, this should not happen...'
        if (bill.timestamps.closed) throw 'This bill was already closed'
        let item, variant, taxRate, subtotal, tax, captions, analytics_helper

        const { day_id, day_created, is_panel_click = false } = bill.analytics_helper

        if (item_id === 'custom') {
            taxRate = restaurant.tax_rates[tax_rate_id] || { id: 'none', name: '', percent: 0 }
            subtotal = singleSubtotal({ size, filters, modifiers, upsells, custom, comped })
            comped.tax = 0
            tax = Math.round(subtotal * taxRate.percent / 100)
            captions = selectionsToCaptions({ size, modifiers, upsells, filters, custom, comped })
            position = '99999999999'
            reference_ids = { dotw_id: '', period_id: '', meal_id: '', menu_id: '', section_id: '', panel_id: '', item_id: 'custom', variant_id: '', }
            variant = {
                name,
                tax_rate_id,
                printer_id,
                course: '',
            }
            analytics_helper = createBillItemAnalytics({ filters, modifiers, upsells }, day_id, day_created, is_panel_click)
        }
        else if (add.length || edit.length) {
            const itemRef = restaurantRef.collection('Items').doc(item_id)

            item = (await transaction.get(itemRef)).data()
            if (!item) throw 'Cannot find bill, is someone changing the menus?'

            if (variant_id && !item.variants[variant_id]) throw 'This item variant cannot be found, is someone changing the menus?'
            variant = { ...item, ...item.variants[variant_id] }

            taxRate = restaurant.tax_rates[variant.tax_rate_id]
            subtotal = singleSubtotal({ size, filters, modifiers, upsells, custom, comped })
            comped.tax = Math.round(comped.subtotal * taxRate.percent / 100)
            // Most accurate, even if overkill for IRS
            tax = Math.round((subtotal + comped.subtotal) * taxRate.percent / 100) - comped.tax
            captions = selectionsToCaptions({ size, modifiers, upsells, filters, custom, comped })
            analytics_helper = createBillItemAnalytics({ filters, modifiers, upsells, }, day_id, day_created, is_panel_click)
        }


        let failedToEdit = 0
        let failedToRemove = 0
        let failedToUnvoid = 0

        const editDocs = await Promise.all(edit.map(bill_item_id => transaction.get(billRef.collection('BillItems').doc(bill_item_id))))
        const removeDocs = await Promise.all(remove.map(bill_item_id => transaction.get(billRef.collection('BillItems').doc(bill_item_id))))
        const unvoidDocs = await Promise.all(unvoid.map(bill_item_id => transaction.get(billRef.collection('BillItems').doc(bill_item_id))))

        add.forEach(bill_item_id => {
            const newBillItem = {
                id: bill_item_id,
                restaurant_id: restaurantRef.id,
                bill_id,
                table_id: bill.table.id,
                user_id: 'server',
                reference_ids,
                name: variant.name,
                printer_id: variant.printer_id,
                position, // you may need to do 9999999010101 for add new... unless you want to get day, service, meal... it is feasible tho
                course: variant.course,
                size,
                comped: {
                    percent: 0,
                    is_comped: false,
                    subtotal: 0,
                    tax: 0,
                },
                tax_rate: {
                    id: variant.tax_rate_id,
                    ...taxRate,
                },
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
                analytics_helper: { ...analytics_helper, is_panel_click: false },
                comment: '',
                units: {
                    denom: 1,
                    available: [{ subtotal, tax, overage: 0 }],
                    claimed: {},
                    paid: {},
                },
                voided: {
                    is_voided: false,
                    server_id: '',
                    manager_id: '',
                },
                timestamps: {
                    created: firebase.firestore.FieldValue.serverTimestamp(),
                    closed: null,
                    printed: null,
                    marked: variant.printer_id ? null : firebase.firestore.FieldValue.serverTimestamp(),
                },
            }

            transaction.set(billRef.collection('BillItems').doc(bill_item_id), newBillItem, { merge: true })
            transaction.set(billRef.collection('BillItemAnalytics').doc(bill_item_id), newBillItem, { merge: true })

            transaction.set(billRef, {
                bill_item_status: { ordered: firebase.firestore.FieldValue.arrayUnion(bill_item_id) },
                order_summary: handleOrderFields(subtotal, tax,),
                orders: { server: handleOrderFields(subtotal, tax,) },
                comps: handleCompedFields(bill_item_id, undefined, comped)
            }, { merge: true })
        })

        editDocs.forEach(doc => {
            const billItem = doc.data()
            if (billItem?.units.available.length !== 1 || billItem.units.denom !== 1 || billItem.timestamps.closed) return failedToEdit++
            const { user_id, comped: oldComped } = billItem

            const editedBillItem = {
                size,
                filters,
                modifiers,
                upsells,
                custom,
                comped,
                analytics_helper,
                summary: {
                    subtotal,
                    tax,
                    total: subtotal + tax,
                },
                captions,
                units: {
                    available: [{ subtotal, tax, overage: 0 }],
                    denom: 1,
                    claimed: {},
                    paid: {},
                },
            }

            transaction.update(billRef.collection('BillItems').doc(doc.id), editedBillItem)
            transaction.update(billRef.collection('BillItemAnalytics').doc(doc.id), editedBillItem)

            const deltaSubtotal = subtotal - billItem.units.available[0].subtotal
            const deltaTax = tax - billItem.units.available[0].tax

            transaction.set(billRef, {
                order_summary: handleOrderFields(deltaSubtotal, deltaTax,),
                orders: { [user_id === 'server' ? 'server' : 'user']: handleOrderFields(deltaSubtotal, deltaTax,), },
                comps: handleCompedFields(doc.id, oldComped, comped)
            }, { merge: true })

            if (user_id && user_id !== 'server') {
                transaction.set(billRef, {
                    user_status: {
                        [user_id]: { order_total: firebase.firestore.FieldValue.increment(deltaSubtotal + deltaTax) }
                    }
                }, { merge: true })

                transaction.set(billRef.collection('BillUsers').doc(user_id), {
                    order_summary: handleOrderFields(deltaSubtotal, deltaTax,)
                }, { merge: true })
            }
        })

        removeDocs.forEach(doc => {
            const billItem = doc.data()
            if (billItem?.units.available.length !== 1 || billItem.units.denom !== 1 || billItem.timestamps.closed) return failedToRemove++
            // else if (billItem.user_id === 'server') {
            //     transaction.delete(billRef.collection('BillItems').doc(doc.id))
            //     transaction.delete(billRef.collection('BillItemAnalytics').doc(doc.id))
            // }
            else {
                const { id: bill_item_id, user_id, units: { available }, comped: oldComped } = billItem
                const iSubtotal = available[0].subtotal
                const iTax = available[0].tax

                transaction.set(billRef.collection('BillItems').doc(doc.id), {
                    voided: { is_voided: true },
                    units: { available: [] },
                    // timestamps: {
                    //     // closed: firebase.firestore.FieldValue.serverTimestamp(),
                    //     ...!!isOrder && {
                    //         marked: firebase.firestore.FieldValue.serverTimestamp(),
                    //     },
                    // }
                }, { merge: true })

                transaction.set(billRef.collection('BillItemAnalytics').doc(doc.id), {
                    voided: { is_voided: true },
                }, { merge: true })

                transaction.set(billRef, {
                    bill_item_status: {
                        ordered: firebase.firestore.FieldValue.arrayRemove(bill_item_id),
                        [user_id && user_id !== 'server' ? 'voided' : 'deleted']: firebase.firestore.FieldValue.arrayUnion(bill_item_id),
                    },
                    order_summary: handleOrderFields(-iSubtotal, -iTax),
                    orders: { [user_id === 'server' ? 'server' : 'user']: handleOrderFields(-iSubtotal, -iTax), },
                    comps: handleCompedFields(bill_item_id, oldComped, undefined),
                }, { merge: true })

                if (user_id && user_id !== 'server') {
                    transaction.set(billRef, {
                        voids: handleVoidedFields(iSubtotal, iTax,),
                        user_status: {
                            [user_id]: { order_total: firebase.firestore.FieldValue.increment(-(iSubtotal + iTax)) }
                        }
                    }, { merge: true })

                    transaction.set(billRef.collection('BillUsers').doc(user_id), {
                        order_summary: handleOrderFields(-iSubtotal, -iTax),
                        voids: {
                            ...handleVoidedFields(iSubtotal, iTax,),
                            bill_item_ids: firebase.firestore.FieldValue.arrayUnion(bill_item_id),
                        }
                    }, { merge: true })
                }
            }
        })

        unvoidDocs.forEach(doc => {
            const billItem = doc.data()
            if (!billItem?.voided?.is_voided) return failedToUnvoid++
            const { id: bill_item_id, user_id, comped: oldComped } = billItem
            const iSubtotal = billItem.summary.subtotal
            const iTax = billItem.summary.tax

            transaction.set(billRef.collection('BillItems').doc(doc.id), {
                voided: { is_voided: false },
                units: {
                    available: [{ subtotal: iSubtotal, tax: iTax, overage: 0 }]
                },
                // timestamps: { closed: null }
            }, { merge: true })

            transaction.set(billRef.collection('BillItemAnalytics').doc(doc.id), {
                voided: { is_voided: false },
            }, { merge: true })

            transaction.set(billRef, {
                bill_item_status: {
                    ordered: firebase.firestore.FieldValue.arrayUnion(bill_item_id),
                    [user_id && user_id !== 'server' ? 'voided' : 'deleted']: firebase.firestore.FieldValue.arrayRemove(bill_item_id),
                },
                order_summary: handleOrderFields(iSubtotal, iTax),
                orders: { [user_id === 'server' ? 'server' : 'user']: handleOrderFields(iSubtotal, iTax,), },
                comps: handleCompedFields(bill_item_id, undefined, oldComped),
            }, { merge: true })

            if (user_id && user_id !== 'server') {
                transaction.set(billRef, {
                    voids: handleVoidedFields(-iSubtotal, -iTax,),
                    user_status: {
                        [user_id]: { order_total: firebase.firestore.FieldValue.increment((iSubtotal + iTax)) }
                    }
                }, { merge: true })

                transaction.set(billRef.collection('BillUsers').doc(user_id), {
                    order_summary: handleOrderFields(iSubtotal, iTax),
                    voids: {
                        ...handleVoidedFields(-iSubtotal, -iTax,),
                        bill_item_ids: firebase.firestore.FieldValue.arrayRemove(bill_item_id),
                    },
                }, { merge: true })
            }
        })

        return [failedToEdit, failedToRemove, failedToUnvoid]
    })
}