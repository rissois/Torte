import firebase from "firebase";

export const transactMarkBillClosed = (restaurantRef, bill_id) => {
    const billRef = restaurantRef.collection('Bills').doc(bill_id)

    return firebase.firestore().runTransaction(async transaction => {
        const bill = (await transaction.get(billRef)).data()
        if (!bill) throw 'Cannot find bill, this should not happen...'

        const {
            order_summary,
            paid_summary,
            bill_item_status: { paid, claimed, ordered, voided, deleted },
        } = bill;

        if (order_summary.total > paid_summary.total) throw 'Bill is not fully paid, mark as unpaid instead'

        transaction.set(billRef, {
            timestamps: {
                closed: firebase.firestore.FieldValue.serverTimestamp(),
                unpaid: null,
            }
        }, { merge: true })

        {
            [...paid, ...claimed, ...ordered, ...voided, ...deleted].forEach(bill_item_id => {
                transaction.set(billRef.collection('BillItems').doc(bill_item_id), {
                    timestamps: { closed: firebase.firestore.FieldValue.serverTimestamp(), }
                }, { merge: true })
            })
        }
    })
}

// Both for re-opening a bill AND undoing an unpaid bill
export const transactMarkBillOpen = (restaurantRef, bill_id, isCancellingUnpaid) => {
    const billRef = restaurantRef.collection('Bills').doc(bill_id)

    return firebase.firestore().runTransaction(async transaction => {
        const bill = (await transaction.get(billRef)).data()
        if (!bill) throw 'Cannot find bill, this should not happen...'

        const {
            bill_item_status: { paid, claimed, ordered, voided, deleted },
        } = bill;

        if (bill.timestamps.closed) throw 'Bill is already open'
        if (isCancellingUnpaid && !bill.timestamps.unpaid) throw 'Bill is not reported as unpaid'

        transaction.set(billRef, {
            timestamps: {
                charged: null,
                closed: null,
                unpaid: null,
            }
        }, { merge: true })

        if (!isCancellingUnpaid) {
            [...paid, ...claimed, ...ordered, ...voided, ...deleted].forEach(bill_item_id => {
                transaction.set(billRef.collection('BillItems').doc(bill_item_id), {
                    timestamps: {
                        closed: null,
                    },
                }, { merge: true })
            })
        }
    })
}

export const transactMarkBillUnpaid = (restaurantRef, bill_id) => {
    const billRef = restaurantRef.collection('Bills').doc(bill_id)

    return firebase.firestore().runTransaction(async transaction => {
        const bill = (await transaction.get(billRef)).data()
        if (!bill) throw 'Cannot find bill, this should not happen...'

        const {
            order_summary,
            paid_summary,
        } = bill;

        if (order_summary.total <= paid_summary.total) throw 'Bill was fully paid'

        transaction.set(billRef, {
            timestamps: {
                unpaid: firebase.firestore.FieldValue.serverTimestamp(),
            }
        }, { merge: true })
    })
}

// NOT SUPPORTED, focus on VOIDING entire bill instead
// export const transactMarkBillUnrecovered = (restaurantRef, bill_id) => {
//     const billRef = restaurantRef.collection('Bills').doc(bill_id)

//     return firebase.firestore().runTransaction(async transaction => {
//         const bill = (await transaction.get(billRef)).data()
//         if (!bill) throw 'Cannot find bill, this should not happen...'

//         const {
//             order_summary,
//             paid_summary,
//             bill_item_status: { paid, claimed, ordered },
//             voided: { bill_item_ids: voided, } = { bill_item_ids: [] },
//         } = bill;

//         if (order_summary.total <= paid_summary.total) throw 'Bill was fully paid, mark as closed instead'
//         if (bill.user_ids.length && !bill.timestamps.unpaid) throw 'Bill must first be marked unpaid before marking as unrecovered'

//         transaction.set(billRef, {
//             timestamps: {
//                 closed: firebase.firestore.FieldValue.serverTimestamp(),
//             }
//         }, { merge: true })

//         {
//             [...paid, ...claimed, ...ordered, ...voided].forEach(bill_item_id => {
//                 transaction.set(billRef.collection('BillItems').doc(bill_item_id), {
//                     timestamps: { closed: firebase.firestore.FieldValue.serverTimestamp(), }
//                 }, { merge: true })
//             })
//         }
//     })
// }