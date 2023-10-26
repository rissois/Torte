import { getFirestore, runTransaction, collection, doc, increment, arrayRemove, arrayUnion, deleteField } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import firebaseApp from '../../firebase/firebase'

const auth = getAuth(firebaseApp)
const firestore = getFirestore(firebaseApp)


export const transactPayAll = (restaurant_id, bill_id, isClaiming) => {
    const myID = auth.currentUser.uid

    const billRef = doc(firestore, 'Restaurants', restaurant_id, 'Bills', bill_id)

    return runTransaction(firestore, async transaction => {
        const { bill_item_status, pay_status: { claim_all } } = (await transaction.get(billRef)).data()

        if (isClaiming) {
            if (bill_item_status.claimed.length) {
                throw 'Must split bill'
            }
            else if (!bill_item_status.ordered.length) {
                throw 'No items to be paid'
            }
        }
        else if (!claim_all[myID]) {
            return null
        }

        const bill_item_ids = isClaiming ? bill_item_status.ordered : claim_all[myID]

        const billItemSnapshots = await Promise.all(bill_item_ids.map(bill_item_id => transaction.get(doc(billRef, 'BillItems', bill_item_id))))

        let incrementSubtotal = 0
        let incrementTax = 0

        billItemSnapshots.forEach(billItemSnapshot => {
            let { units: { available, claimed: { [myID]: myUnits } } } = billItemSnapshot.data()

            if (isClaiming) {
                transaction.set(billItemSnapshot.ref, {
                    units: {
                        available: [],
                        claimed: {
                            [myID]: available
                        }
                    }
                }, { merge: true })

                incrementSubtotal += available[0].subtotal
                incrementTax += available[0].tax
            }
            else {
                transaction.set(billItemSnapshot.ref, {
                    units: {
                        available: myUnits,
                        claimed: {},
                    }
                }, { merge: true })

                incrementSubtotal -= myUnits[0].subtotal
                incrementTax -= myUnits[0].tax
            }
        })

        transaction.set(doc(billRef, 'BillUsers', myID), {
            claim_summary: {
                subtotal: increment(incrementSubtotal),
                tax: increment(incrementTax),
                total: increment(incrementSubtotal + incrementTax),
                bill_item_ids: isClaiming ? arrayUnion(...bill_item_ids) : arrayRemove(...bill_item_ids)
            }
        },
            { merge: true })

        transaction.set(billRef, {
            bill_item_status: {
                ordered: isClaiming ? arrayRemove(...bill_item_ids) : arrayUnion(...bill_item_ids),
                claimed: isClaiming ? arrayUnion(...bill_item_ids) : arrayRemove(...bill_item_ids)
            },
            pay_status: {
                claim_all: {
                    [myID]: isClaiming ? bill_item_ids : deleteField()
                }
            }
        }, { merge: true })
    })
}