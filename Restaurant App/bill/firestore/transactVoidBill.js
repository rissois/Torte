import firebase from "firebase";
import { compRemainder } from "./transactCompRemainder";

const handleOrderFields = (subtotal, tax) => ({
    subtotal: firebase.firestore.FieldValue.increment(subtotal),
    tax: firebase.firestore.FieldValue.increment(tax),
    total: firebase.firestore.FieldValue.increment(subtotal + tax),
})

const handleVoidedFields = (subtotal, tax,) => ({
    subtotal: firebase.firestore.FieldValue.increment(subtotal),
    tax: firebase.firestore.FieldValue.increment(tax),
})

export const transactVoidBill = (
    restaurantRef,
    bill_id,
    isVoiding,
    approvedComp,
) => {
    const billRef = restaurantRef.collection('Bills').doc(bill_id)

    return firebase.firestore().runTransaction(async transaction => {
        const bill = (await transaction.get(billRef)).data()
        if (!bill) throw 'Cannot find bill, this should not happen...'
        if (bill.is_deleted === isVoiding) return

        const { bill_item_status: { paid, claimed, ordered, voided, deleted, void_all } } = bill

        if (isVoiding) {
            // Check whether any items are partially paid
            // These cannot be voided, and must be offset by a comp "item"
            const partiallyPaidItems = paid.filter(bill_item_id => ordered.includes(bill_item_id) || claimed.includes(bill_item_id))

            if (!approvedComp) {
                if (partiallyPaidItems) {
                    let comp = { subtotal: 0, tax: 0 }

                    const billItemDocs = await Promise.all(partiallyPaidItems.map(bill_item_id => transaction.get(billRef.collection('BillItems').doc(bill_item_id))))
                    billItemDocs.forEach(doc => {
                        const units = doc.data().units
                        units.available.forEach(unit => {
                            comp.subtotal += unit.subtotal
                            comp.tax += unit.tax
                        })
                        Object.keys(units.claimed).forEach(user_id => {
                            units.claimed[user_id].forEach(unit => {
                                comp.subtotal += unit.subtotal
                                comp.tax += unit.tax
                            })
                        })
                    })

                    if (comp.subtotal || comp.tax) return { comp }
                }
            }

            const fullyUnpaidItems = [...new Set([...claimed, ...ordered])].filter(bill_item_id => !partiallyPaidItems.includes(bill_item_id))

            const billItemDocs = await Promise.all(fullyUnpaidItems.map(bill_item_id => transaction.get(billRef.collection('BillItems').doc(bill_item_id))))

            billItemDocs.forEach(doc => {
                const billItem = doc.data()
                if (billItem?.voided?.is_voided || billItem.timestamps?.closed) throw 'Unexpected voided item'

                const { id: bill_item_id, user_id, units: { available }, } = billItem

                const iSubtotal = available[0].subtotal
                const iTax = available[0].tax

                transaction.set(billRef.collection('BillItems').doc(doc.id), {
                    voided: { is_voided: true },
                    units: { available: [] },
                    timestamps: {
                        closed: firebase.firestore.FieldValue.serverTimestamp(),
                    }
                }, { merge: true })

                transaction.set(billRef.collection('BillItemAnalytics').doc(doc.id), {
                    voided: { is_voided: true },
                }, { merge: true })

                transaction.set(billRef, {
                    bill_item_status: {
                        ordered: firebase.firestore.FieldValue.arrayRemove(bill_item_id),
                        void_all: firebase.firestore.FieldValue.arrayUnion(bill_item_id),
                    },
                    order_summary: handleOrderFields(-iSubtotal, -iTax),
                    orders: { [user_id === 'server' ? 'server' : 'user']: handleOrderFields(-iSubtotal, -iTax), },
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
                        voids: handleVoidedFields(iSubtotal, iTax, bill_item_id, true)
                    }, { merge: true })
                }
            })

            if (approvedComp) {
                compRemainder(transaction, bill, billRef, approvedComp.subtotal, approvedComp.tax, true)
            }

            transaction.set(billRef, {
                is_deleted: !paid.length,
                timestamps: {
                    closed: firebase.firestore.FieldValue.serverTimestamp()
                },
            }, { merge: true });

            [...paid, ...claimed, ...ordered, ...voided, ...deleted].forEach(bill_item_id => {
                transaction.set(billRef.collection('BillItems').doc(bill_item_id), {
                    timestamps: { closed: firebase.firestore.FieldValue.serverTimestamp(), }
                }, { merge: true })
            })

            return { isWithUsers: !!bill.user_ids.length }

        }
        else {
            const billItemDocs = await Promise.all(void_all.map(bill_item_id => transaction.get(billRef.collection('BillItems').doc(bill_item_id))))

            billItemDocs.forEach(doc => {
                const billItem = doc.data()
                if (!billItem?.voided?.is_voided) throw 'Unexpected unvoided item'
                const { id: bill_item_id, user_id, } = billItem
                const iSubtotal = billItem.summary.subtotal
                const iTax = billItem.summary.tax

                transaction.set(billRef.collection('BillItems').doc(doc.id), {
                    voided: { is_voided: false },
                    units: {
                        available: [{ subtotal: iSubtotal, tax: iTax, overage: 0 }]
                    },
                    timestamps: { closed: null }
                }, { merge: true })

                transaction.set(billRef.collection('BillItemAnalytics').doc(doc.id), {
                    voided: { is_voided: false },
                }, { merge: true })

                transaction.set(billRef, {
                    bill_item_status: {
                        ordered: firebase.firestore.FieldValue.arrayUnion(bill_item_id),
                        void_all: firebase.firestore.FieldValue.arrayRemove(bill_item_id)
                    },
                    order_summary: handleOrderFields(iSubtotal, iTax),
                    orders: { [user_id === 'server' ? 'server' : 'user']: handleOrderFields(iSubtotal, iTax), },
                }, { merge: true })

                if (user_id && user_id !== 'server') {
                    transaction.set(billRef, {
                        voids: handleVoidedFields(-iSubtotal, -iTax),
                        user_status: {
                            [user_id]: { order_total: firebase.firestore.FieldValue.increment((iSubtotal + iTax)) }
                        }
                    }, { merge: true })

                    transaction.set(billRef.collection('BillUsers').doc(user_id), {
                        order_summary: handleOrderFields(iSubtotal, iTax),
                        voids: handleVoidedFields(-iSubtotal, -iTax),
                    }, { merge: true })
                }
            })

            transaction.set(billRef, {
                is_deleted: false,
                timestamps: {
                    closed: null
                },
            }, { merge: true });

            [...paid, ...claimed, ...ordered, ...voided, ...deleted,].forEach(bill_item_id => {
                transaction.set(billRef.collection('BillItems').doc(bill_item_id), {
                    timestamps: { closed: null }
                }, { merge: true })
            })
        }

    })
}