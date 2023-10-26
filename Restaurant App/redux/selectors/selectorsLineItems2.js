import { createSelector } from 'reselect'
import { createShallowEqualSelector } from './selectorCreators'
import { selectBillItemsFromBill } from './selectorsBillItems'

const emptyArray = []
const emptyObject = {}

const selectLineItems = state => state.lineItems2 ?? emptyObject

selectLineItemsByBill = bill_id => createSelector(
    selectLineItems,
    lineItems => lineItems[bill_id] ?? emptyObject
)

export const selectLineItemsForBill = bill_id => createSelector(
    selectLineItemsByBill(bill_id),
    bill => bill.bill ?? emptyObject
)

export const selectLineItemForBill = (bill_id, line_item_id) => createSelector(
    selectLineItemsForBill(bill_id),
    lineItems => lineItems[line_item_id] ?? emptyObject
)

export const selectLineItemIDsForBill = bill_id => createSelector(
    selectLineItemsForBill(bill_id),
    lineItems => Object.keys(lineItems)
        .sort((a, b) => lineItems[a].position - lineItems[b].position)
)

export const selectLineItemsForOrder = bill_id => createSelector(
    selectLineItemsByBill(bill_id),
    bill => bill.order ?? emptyObject
)

export const selectLineItemForOrder = (bill_id, line_item_id) => createSelector(
    selectLineItemsForOrder(bill_id),
    lineItems => lineItems[line_item_id] ?? emptyObject
)

export const selectLineItemIDsForOrder = bill_id => createSelector(
    selectLineItemsForOrder(bill_id),
    lineItems => Object.keys(lineItems)
        .sort((a, b) => lineItems[a].position - lineItems[b].position)
)