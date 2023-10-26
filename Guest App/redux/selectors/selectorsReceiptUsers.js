import { createSelector } from 'reselect'
import { selectMyID } from './selectorsUser'

const emptyObject = {}
const emptyArray = []

const selectReceiptUsers = state => state.receipt.receiptUsers

const selectReceiptUser = (user_id) => createSelector(
    selectReceiptUsers,
    receiptUsers => receiptUsers[user_id] || emptyObject
)

export const selectMyReceiptUser = createSelector(
    selectReceiptUsers,
    selectMyID,
    (receiptUsers, myID) => receiptUsers[myID] || emptyObject
)

export const selectMyClaimSubtotal = createSelector(
    selectMyReceiptUser,
    myReceiptUser => myReceiptUser.claim_summary?.subtotal ?? 0
)

export const selectMyClaimNumber = createSelector(
    selectMyReceiptUser,
    myReceiptUser => myReceiptUser.claim_summary?.receipt_item_ids?.length ?? 0
)

// export const selectMyClaimTax = createSelector(
//     selectMyReceiptUser,
//     myReceiptUser => myReceiptUser.claim_summary?.tax ?? 0
// )

