import { useCallback, } from 'react';
import {
  StyleSheet,
} from 'react-native';
import { useDispatch, useSelector, } from 'react-redux';
import { doAlertAdd } from '../../redux/actions/actionsAlerts';
import { selectReceiptID } from '../../redux/selectors/selectorsReceipt';
import { useMyID } from '../../utils/hooks/useUser.web';

import { doc, runTransaction, arrayRemove, arrayUnion, deleteField, getFirestore, increment } from 'firebase/firestore'
import firebaseApp from '../../firebase/firebase'

const firestore = getFirestore(firebaseApp)

const sortByOverage = (a, b) => a.overage - b.overage
const reduceField = field => (acc, { [field]: value }) => acc + value

/**
 * 
 * @param {Function} onStart given receipt_item_ids as argument
 * @param {Function} onSuccess given receipt_item_ids as argument
 * @param {Function} onFailure given receipt_item_ids as argument
 * @returns receiptSplit callback
 */
export default function useReceiptSplit(onStart, onSuccess, onFailure) {
  const receipt_id = useSelector(selectReceiptID)
  const myID = useMyID()
  const dispatch = useDispatch()

  /**
   * @param {Array} receipt_item_ids
   * @param {Number} initialNum number of units requested
   * @param {Number} initialDenom denominator for number of units requested
   * @returns 
   */
  const receiptSplit = useCallback(async (receipt_item_ids, initialNum, initialDenom) => {
    // numRequested does NOT include any prior paid units by this user

    // CLAIM ALL with numRequested = Infinity; denomRequested = undefined
    // UNCLAIM ALL with numRequested === 0; denomRequested = undefined

    if (typeof receipt_item_ids === 'string') {
      receipt_item_ids = [receipt_item_ids]
    }

    const receiptRef = doc(firestore, 'Receipts', receipt_id)

    onStart()

    try {
      await runTransaction(firestore, async transaction => {
        const receiptUserRef = doc(receiptRef, 'ReceiptUsers', myID)
        let { claim_summary } = (await transaction.get(receiptUserRef)).data()
        let succeeded_receipt_item_ids = []

        const receiptItemSnapshots = await Promise.all(receipt_item_ids.map(receipt_item_id => transaction.get(doc(receiptRef, 'ReceiptItems', receipt_item_id))))

        receiptItemSnapshots.forEach(receiptItemSnapshot => {
          let { id: receipt_item_id, units: { available, claimed, denom, }, summary: { subtotal, } } = receiptItemSnapshot.data()

          const numIClaimed = claimed[myID]?.length || 0
          const numRequested = initialNum === Infinity ? (available.length + numIClaimed) : initialNum

          let denomRequested = initialDenom || denom
          const isDenomChanged = denom !== denomRequested
          const isDenomLocked = Object.keys(claimed).some(user_id => user_id !== myID)

          if (!isDenomChanged && numIClaimed === numRequested) return // dispatch(doSuccessReceiptItemSplit([receiptItemSnapshot.id]))

          if (!isDenomChanged && numRequested > (available.length + numIClaimed)) return // dispatch(doSuccessReceiptItemSplit([receiptItemSnapshot.id]))

          if (isDenomLocked && isDenomChanged && numRequested) return // dispatch(doSuccessReceiptItemSplit([receiptItemSnapshot.id]))

          succeeded_receipt_item_ids.push(receipt_item_id)

          if (claimed[myID]) {
            if (isDenomChanged || (!isDenomLocked && !numRequested)) {
              // RESET if changing portions OR only user is going down to 0

              claim_summary.subtotal -= claimed[myID]?.reduce(reduceField('subtotal'), 0)
              claim_summary.overage -= claimed[myID]?.reduce(reduceField('overage'), 0)

              available = [{ subtotal, overage: 0 }]
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

            available = []

            for (let i = 0; i < denomRequested; i++) {
              const portionSubtotal = minPortionSubtotal + (i < moduloPortionSubtotal)
              available.push({
                subtotal: portionSubtotal,
                overage: portionSubtotal - exactPortionSubtotal
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

          transaction.set(receiptRef, {
            receipt_item_status: {
              ordered: available.length ? arrayUnion(receipt_item_id) : arrayRemove(receipt_item_id),
              claimed: isUnclaimed ? arrayRemove(receipt_item_id) : arrayUnion(receipt_item_id),
            },
          }, { merge: true })

          transaction.set(receiptItemSnapshot.ref, {
            units: {
              available,
              claimed,
              denom: denomRequested
            }
          }, { merge: true })

        })

        transaction.set(receiptUserRef, {
          claim_summary: {
            ...claim_summary,
            receipt_item_ids: initialNum ? arrayUnion(...succeeded_receipt_item_ids) : arrayRemove(...succeeded_receipt_item_ids)
          },
        }, { merge: true })

        transaction.set(receiptRef, {
          user_status: { [myID]: { subtotal: claim_summary.subtotal } }
        }, { merge: true })
      })

      onSuccess(receipt_item_ids)
    }
    catch (error) {
      console.log('useReceiptSplit error: ', error)
      dispatch(doAlertAdd('Splitting failed', 'Please try again and let us know if the issue persists.'))
      onFailure(receipt_item_ids)
    }
  }, [])

  return receiptSplit
}


const styles = StyleSheet.create({
});