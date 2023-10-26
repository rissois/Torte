import { createSelector } from 'reselect'

// debatable whether these belong in BillGroups, BillOrders, and BillItems
const selectFirestore = state => state.firestore

const selectPendingBillGroupIDs = createSelector(
    selectFirestore,
    firestore => firestore.pending_bill_group_ids
)

export const selectIsPendingBillGroup = (bill_group_id) => createSelector(
    selectPendingBillGroupIDs,
    pendingBillGroupIDs => pendingBillGroupIDs.includes(bill_group_id)
)

const selectClaimingBillItemIDs = createSelector(
    selectFirestore,
    firestore => firestore.claiming_bill_item_ids
)

export const selectIsClaimingBillItem = (bill_item_id) => createSelector(
    selectClaimingBillItemIDs,
    claimingBillItemIDs => claimingBillItemIDs.includes(bill_item_id)
)