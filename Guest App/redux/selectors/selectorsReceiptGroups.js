import { createSelector } from 'reselect'
import { createShallowEqualSelector } from './selectorCreators'
import { selectReceiptUserNames } from './selectorsReceipt'
import { selectMyID } from './selectorsUser'

const emptyObject = {}
const emptyArray = []

export const selectReceiptGroups = state => state.receipt.receiptGroups

export const selectReceiptGroupIDsSorted = createSelector(
    selectReceiptGroups,
    receiptGroups => Object.keys(receiptGroups).sort((a, b) => {
        if (receiptGroups[a].position === receiptGroups[b].position) return receiptGroups[a].name - receiptGroups[b].name
        return receiptGroups[a].position - receiptGroups[b].position
    })
)

export const selectReceiptSubtotal = createSelector(
    selectReceiptGroups,
    receiptGroups => Object.keys(receiptGroups).reduce((sum, id) => sum + (receiptGroups[id].subtotal), 0)
)

export const selectReceiptGroup = (receipt_group_id) => createSelector(
    selectReceiptGroups,
    receiptGroups => receiptGroups[receipt_group_id] ?? emptyObject
)
