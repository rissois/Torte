import { doc, runTransaction, arrayRemove, arrayUnion, deleteField, getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { doAlertAdd } from "../../redux/actions/actionsAlerts"
import firebaseApp from '../../firebase/firebase'

const auth = getAuth(firebaseApp)
const firestore = getFirestore(firebaseApp)


const doStartBillItemSplit = (bill_item_ids) => {
    return { type: 'firestore/START_PAY_SPLIT', bill_item_ids }
}

export const doSuccessBillItemSplit = (bill_item_ids) => {
    return { type: 'firestore/SUCCESS_PAY_SPLIT', bill_item_ids }
}

export const doFailBillItemSplit = (bill_item_ids) => {
    return { type: 'firestore/FAIL_PAY_SPLIT', bill_item_ids }
}

export const doRejectBillItemSplit = (bill_item_ids) => {
    return { type: 'firestore/REJECT_PAY_SPLIT', bill_item_ids }
}

const sortByOverage = (a, b) => a.overage - b.overage
const reduceField = field => (acc, { [field]: value }) => acc + value

/*
    Claim all (remaining)       DENOM ∞ === simple up
    Remove all                  NUM 0
        As only user                === reset
        As one of many users        === simple down
    Alter number of portions        === reset
        With existing claim         then add
        Without existing claim      then add
    Simple down
    Simple up
*/

const print = (available, claimed) => {
    console.log('AVAILABLE: ')
    if (available.length) {
        available.forEach(unit => {
            console.log('   ', unit)
        })
    }
    else {
        console.log('   NO UNITS')
    }


    console.log('++++')

    console.log('CLAIMED: ')
    if (claimed) {
        claimed.forEach(unit => {
            console.log('   ', unit)
        })
    }
    else {
        console.log('   NO UNITS')
    }


    console.log('----')
}

// THIS WILL BECOME AN HTTPS CALLABLE
export const doTransactPaySplit = (bill_item_ids, initialNum, initialDenom) => {
    // numRequested does NOT include any prior paid units by this user

    // CLAIM ALL with numRequested = Infinity; denomRequested = undefined
    // UNCLAIM ALL with numRequested === 0; denomRequested = undefined

    if (typeof bill_item_ids === 'string') {
        bill_item_ids = [bill_item_ids]
    }

    return async function (dispatch, getState) {
        const myID = auth.currentUser.uid
        const {
            trackers: { restaurant_id, bill_id, },
        } = getState()


        const billRef = doc(firestore, 'Restaurants', restaurant_id, 'Bills', bill_id)


        dispatch(doStartBillItemSplit(bill_item_ids))
        let rejected_bill_items = []
        let succeeded_bill_item_ids = []
        let fullyUnclaimedBillItemIds = []

        try {
            await runTransaction(firestore, async transaction => {
                const billUserRef = doc(billRef, 'BillUsers', myID)
                let { claim_summary } = (await transaction.get(billUserRef)).data()
                const billItemSnapshots = await Promise.all(bill_item_ids.map(bill_item_id => transaction.get(doc(billRef, 'BillItems', bill_item_id))))

                billItemSnapshots.forEach(billItemSnapshot => {
                    let { id: bill_item_id, units: { available, claimed, denom, paid }, name, summary: { subtotal, tax } } = billItemSnapshot.data()

                    const numIClaimed = claimed[myID]?.length || 0
                    const numRequested = initialNum === Infinity ? (available.length + numIClaimed) : initialNum

                    let denomRequested = initialDenom || denom
                    const isDenomChanged = denom !== denomRequested
                    const isDenomLocked = Object.keys(claimed).some(user_id => user_id !== myID) || Object.keys(paid).length

                    if (!isDenomChanged && numIClaimed === numRequested) return dispatch(doSuccessBillItemSplit([billItemSnapshot.id]))

                    if (!isDenomChanged && numRequested > (available.length + numIClaimed)) return dispatch(doSuccessBillItemSplit([billItemSnapshot.id]))

                    if (isDenomLocked && isDenomChanged && numRequested) return dispatch(doSuccessBillItemSplit([billItemSnapshot.id]))

                    succeeded_bill_item_ids.push(billItemSnapshot.id)

                    if (claimed[myID]) {
                        if (isDenomChanged || (!isDenomLocked && !numRequested)) {
                            // RESET if changing portions OR only user is going down to 0

                            claim_summary.subtotal -= claimed[myID]?.reduce(reduceField('subtotal'), 0)
                            claim_summary.tax -= claimed[myID]?.reduce(reduceField('tax'), 0)
                            claim_summary.overage -= claimed[myID]?.reduce(reduceField('overage'), 0)

                            available = [{ subtotal, tax, overage: 0 }]
                            delete claimed[myID]
                            if (!numRequested) {
                                denomRequested = 1
                            }
                        }
                        else if ((!isDenomChanged && numIClaimed > numRequested) || (isDenomLocked && !numRequested)) {
                            // REDUCE if lowering amount OR one of many users going down to 0

                            for (let i = numIClaimed; i > numRequested; i--) {
                                // If loss of the highest overage stays above -0.5, remove from end. Otherwise, remove from start
                                const reducedUnit = claim_summary.overage - claimed[myID][claimed[myID].length - 1].overage > -0.5 ? claimed[myID].pop() : claimed[myID].shift()
                                claim_summary.subtotal -= reducedUnit.subtotal
                                claim_summary.tax -= reducedUnit.tax
                                claim_summary.overage -= reducedUnit.overage
                                available.push(reducedUnit)
                            }
                            available.sort(sortByOverage)

                            // print(available, claimed[user_id])
                        }
                    }

                    if (isDenomChanged && numRequested) {
                        // SPLIT available units if changing the number of portions

                        const exactPortionSubtotal = subtotal / denomRequested
                        const minPortionSubtotal = Math.floor(exactPortionSubtotal)
                        const moduloPortionSubtotal = subtotal % denomRequested
                        const exactPortionTax = tax / denomRequested
                        const minPortionTax = Math.floor(exactPortionTax)
                        const moduloPortionTax = tax % denomRequested

                        const exactPortionTotal = exactPortionSubtotal + exactPortionTax

                        available = []

                        for (let i = 0; i < denomRequested; i++) {
                            const portionSubtotal = minPortionSubtotal + (i < moduloPortionSubtotal)
                            const portionTax = minPortionTax + (i >= (denomRequested - moduloPortionTax))
                            available.push({
                                subtotal: portionSubtotal,
                                tax: portionTax,
                                overage: (portionSubtotal + portionTax) - exactPortionTotal
                            })
                        }

                        available.sort(sortByOverage)

                        // print(available, claimed[user_id])

                    }

                    if ((numRequested > numIClaimed) || (isDenomChanged && numRequested)) {
                        // CLAIM units

                        if (!claimed[myID]) {
                            claimed[myID] = []
                        }
                        // ADD if increasing amount OR had reset the number of portions
                        for (let i = isDenomChanged ? 0 : numIClaimed; i < numRequested; i++) {
                            const addedUnit = claim_summary.overage + available[available.length - 1].overage < 0.5 ? available.pop() : available.shift()
                            claim_summary.subtotal += addedUnit.subtotal
                            claim_summary.tax += addedUnit.tax
                            claim_summary.overage += addedUnit.overage
                            claimed[myID].push(addedUnit)
                        }
                        claimed[myID].sort(sortByOverage)

                        // print(available, claimed[user_id])
                    }

                    let isUnclaimed = false
                    if (!claimed[myID]?.length) {
                        if (Object.keys(claimed).length === 1) isUnclaimed = true
                        claimed[myID] = deleteField()
                    }

                    transaction.set(billRef, {
                        bill_item_status: {
                            ordered: available.length ? arrayUnion(bill_item_id) : arrayRemove(bill_item_id),
                            claimed: isUnclaimed ? arrayRemove(bill_item_id) : arrayUnion(bill_item_id),
                        }
                    }, { merge: true })

                    transaction.set(billItemSnapshot.ref, {
                        units: {
                            available,
                            claimed,
                            denom: denomRequested
                        }
                    }, { merge: true })
                })

                transaction.set(billUserRef, {
                    claim_summary: {
                        ...claim_summary,
                        total: claim_summary.subtotal + claim_summary.tax,
                        bill_item_ids: initialNum ? arrayUnion(...succeeded_bill_item_ids) : arrayRemove(...succeeded_bill_item_ids)
                    },
                }, { merge: true })
            })

            dispatch(doSuccessBillItemSplit(succeeded_bill_item_ids))
        }
        catch (error) {
            console.log('doTransactPaySplit error: ', error)
            dispatch(doAlertAdd('Unable to request payment', 'Please try again and let us know if the issue persists.'))
            dispatch(doFailBillItemSplit(bill_item_ids))
            // NOTE: You can even re-submit with all the stored details
        }
    }
}