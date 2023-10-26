import firebase from "firebase"
import { doAlertAdd } from "./actionsAlerts"

/*
Well the items do need the selections so the server can adjust things.
But the ORDER transaction can verify all the items, promotions, timing, at once.
with each order, just save the user_id and the groups they want. Then you can do transaction.getAll
*/

const db = firebase.firestore()

export const doTransactMarkBillItems = (lineItemsByBill, tableName) => {
    /*
        YOU DON'T WANT TO RE-SUBMIT THE SAME ITEMS MULTIPLE TIMES
        ... for safety's sake you should probably block the BILL while this is processing
    */
    return async function (dispatch, getState) {
        try {
            await db.runTransaction(async transaction => {
                const restaurantRef = db.collection('Restaurants').doc(getState().restaurant.id)

                let markedBillItems = {}

                Object.keys(lineItemsByBill).forEach(bill_id => {
                    lineItemsByBill[bill_id].forEach(lineItem => {
                        if (lineItem.isSelected) {
                            lineItem.bill_item_ids.forEach(bill_item_id => {
                                markedBillItems[bill_item_id] = { ...lineItem, bill_id }
                            })
                        }
                    })
                })

                const billItemSnapshots = await Promise.all(
                    Object.keys(markedBillItems).map(
                        bill_item_id => transaction.get(restaurantRef
                            .collection('Bills').doc(markedBillItems[bill_item_id].bill_id)
                            .collection('BillItems').doc(bill_item_id)
                        )
                    )
                )

                let numberOfFailedBillItems = 0

                billItemSnapshots.forEach(billItemSnapshot => {
                    const data = billItemSnapshot.data()
                    const lineItem = markedBillItems[billItemSnapshot.id]

                    if (data.name === lineItem.name
                        && !!data.voided.is_voided === lineItem.is_voided
                        // Check item_id, and variant_id?
                        && data.captions.line_break === lineItem.captions.line_break
                        && data.summary.subtotal === lineItem.subtotal
                        && data.position === lineItem.position) {
                        transaction.set(billItemSnapshot.ref, {
                            timestamps: {
                                marked: firebase.firestore.FieldValue.serverTimestamp()
                            }
                        }, { merge: true })
                    }
                    else {
                        numberOfFailedBillItems++
                    }
                })

                if (numberOfFailedBillItems) {
                    dispatch(doAlertAdd('Some items no longer matched for table ' + tableName, 'Please try those items again'))
                }
            })
        }
        catch (error) {
            console.log('actionsBillItems doTransactMarkBillItems error: ', error)
            dispatch(doAlertAdd('Failed to mark bill items', error.message || error.code || 'Please let us know if the issue persists'))
        }
    }
}