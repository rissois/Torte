import firestore from '@react-native-firebase/firestore'
import auth from '@react-native-firebase/auth'


export const transactPayAll = (restaurant_id, bill_id, isClaiming) => {
    const myID = auth().currentUser.uid

    const billRef = firestore().collection('Restaurants').doc(restaurant_id)
        .collection('Bills').doc(bill_id)

    return firestore().runTransaction(async transaction => {
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

        const billItemSnapshots = await Promise.all(bill_item_ids.map(bill_item_id => transaction.get(billRef.collection('BillItems').doc(bill_item_id))))

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

        transaction.set(billRef.collection('BillUsers').doc(myID), {
            claim_summary: {
                subtotal: firestore.FieldValue.increment(incrementSubtotal),
                tax: firestore.FieldValue.increment(incrementTax),
                total: firestore.FieldValue.increment(incrementSubtotal + incrementTax),
                bill_item_ids: isClaiming ? firestore.FieldValue.arrayUnion(...bill_item_ids) : firestore.FieldValue.arrayRemove(...bill_item_ids)
            }
        },
            { merge: true })

        transaction.set(billRef, {
            bill_item_status: {
                ordered: isClaiming ? firestore.FieldValue.arrayRemove(...bill_item_ids) : firestore.FieldValue.arrayUnion(...bill_item_ids),
                claimed: isClaiming ? firestore.FieldValue.arrayUnion(...bill_item_ids) : firestore.FieldValue.arrayRemove(...bill_item_ids)
            },
            pay_status: {
                claim_all: {
                    [myID]: isClaiming ? bill_item_ids : firestore.FieldValue.delete()
                }
            }
        }, { merge: true })
    })
}