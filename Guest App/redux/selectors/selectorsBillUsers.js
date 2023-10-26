import { createSelector } from 'reselect'
import { createShallowEqualSelector } from './selectorCreators'
import { selectMyID } from './selectorsUser'

const emptyObject = {}
const emptyArray = []

const selectBillUsers = state => state.bill.billUsers

const selectBillUser = (user_id) => createSelector(
    selectBillUsers,
    billUsers => billUsers[user_id] || emptyObject
)

export const selectMyBillUser = createSelector(
    selectBillUsers,
    selectMyID,
    (billUsers, myID) => billUsers[myID] || emptyObject
)


export const selectMyOrderSubtotal = createSelector(
    selectMyBillUser,
    myBillUser => myBillUser.order_summary?.subtotal ?? 0
)

export const selectMyClaimSubtotal = createSelector(
    selectMyBillUser,
    myBillUser => myBillUser.claim_summary?.subtotal ?? 0
)

export const selectMyClaimNumber = createSelector(
    selectMyBillUser,
    myBillUser => myBillUser.claim_summary?.bill_item_ids?.length ?? 0
)

export const selectMyClaimTax = createSelector(
    selectMyBillUser,
    myBillUser => myBillUser.claim_summary?.tax ?? 0
)

export const selectIsBillPaymentComplete = (bill_payment_id) => createSelector(
    selectMyBillUser,
    myBillUser => myBillUser.analytics_helper?.bill_payment_ids?.includes(bill_payment_id)
)

export const selectMyFeedback = createSelector(
    selectMyBillUser,
    myBillUser => myBillUser.feedback || {}
)
