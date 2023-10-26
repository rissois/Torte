import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'
import { createShallowEqualSelector } from './selectorCreators'
import { selectBillItemsFromBill } from './selectorsBillItems'

const emptyArray = []
const emptyObject = {}

const selectLineItems = state => state.lineItems ?? emptyObject

export const selectLineItem = (bill_id, lineItemID, isOrder) => createSelector(
    selectBillLineItems(bill_id),
    billLineItems => billLineItems[isOrder ? 'order' : 'bill']?.[lineItemID] ?? emptyObject
)

export const selectLineItemField = (bill_id, lineItemID, field, isOrder) => createSelector(
    selectLineItem(bill_id, lineItemID, isOrder),
    lineItem => lineItem[field]
)

export const selectLineItemNestedField = (bill_id, lineItemID, isOrder, ...fields) => createSelector(
    selectLineItem(bill_id, lineItemID, isOrder),
    lineItem => recursiveFieldGetter(lineItem, ...fields)
)


export const selectBillLineItems = bill_id => createSelector(
    selectLineItems,
    lineItems => lineItems[bill_id] ?? emptyObject
)

export const selectLineItemsOnBill = (bill_id) => createSelector(
    selectBillLineItems(bill_id),
    billLineItems => billLineItems.bill ?? emptyObject
)

export const selectLineItemIDsOnBill = (bill_id) => createSelector(
    selectLineItemsOnBill(bill_id),
    lineItems => {
        return Object.keys(lineItems).sort((a, b) => !lineItems[b].is_voided - !lineItems[a].is_voided || lineItems[a].position.localeCompare(lineItems[b].position))
    }
)

export const selectLineItemIDsOnBillByPrintStatus = (bill_id, isPrinted = false) => createSelector(
    selectLineItemsOnBill(bill_id),
    lineItems => {
        return Object.keys(lineItems)
            .filter(lineItemID => isPrinted === !!(lineItems[lineItemID].timestamps.printed || lineItems[lineItemID].timestamps.marked))
            .sort((a, b) => !lineItems[b].voided.is_voided - !lineItems[a].voided.is_voided || lineItems[a].position.localeCompare(lineItems[b].position))
    }
)

export const selectLineItemOnBill = (bill_id, lineItemID) => createSelector(
    selectLineItemsOnBill(bill_id),
    lineItems => lineItems[lineItemID] ?? emptyObject
)

export const selectLineItemItemID = (bill_id, lineItemID) => createSelector(
    selectLineItemOnBill(bill_id, lineItemID),
    lineItem => lineItem.reference_ids.item_id ?? ''
)

export const selectLineItemVariantID = (bill_id, lineItemID) => createSelector(
    selectLineItemOnBill(bill_id, lineItemID),
    lineItem => lineItem.reference_ids.variant_id ?? ''
)

export const selectLineItemNameOnBill = (bill_id, lineItemID) => createSelector(
    selectLineItemOnBill(bill_id, lineItemID),
    lineItem => lineItem.name ?? '(missing)'
)

export const selectLineItemQuantity = (bill_id, lineItemID) => createSelector(
    selectLineItemBillItemIDs(bill_id, lineItemID),
    lineItemBillItemIDs => lineItemBillItemIDs.length ?? 0
)

export const selectLineItemSubtotal = (bill_id, lineItemID) => createSelector(
    selectLineItemOnBill(bill_id, lineItemID),
    lineItem => lineItem.summary.subtotal ?? 0
)

export const selectLineItemCaptions = (bill_id, lineItemID) => createSelector(
    selectLineItemOnBill(bill_id, lineItemID),
    lineItem => lineItem.captions ?? { size: '', filters: '', modifications: '', upsells: '', custom: '', one_line: '', line_break: '' }
)

export const selectLineItemBillItemIDs = (bill_id, lineItemID) => createShallowEqualSelector(
    selectLineItemOnBill(bill_id, lineItemID),
    lineItem => lineItem.bill_item_ids ?? emptyArray
)

export const selectLineItemFirstBillItemID = (bill_id, lineItemID) => createSelector(
    selectLineItemBillItemIDs(bill_id, lineItemID),
    bill_item_ids => bill_item_ids[0] ?? ''
)



export const selectLineItemsOnOrder = (bill_id) => createSelector(
    selectBillLineItems(bill_id),
    billLineItems => billLineItems.order ?? emptyObject
)

export const selectLineItemOnOrder = (bill_id, lineItemID) => createSelector(
    selectLineItemsOnOrder(bill_id),
    lineItems => lineItems[lineItemID] ?? emptyObject
)

export const selectLineItemUserSummary = (bill_id, lineItemID, isOrder) => createSelector(
    selectLineItemField(bill_id, lineItemID, 'bill_item_ids', isOrder),
    selectBillItemsFromBill(bill_id),
    (bill_item_ids, billItems) => {
        // let userSummary = { 'uneditable': [] }
        let userSummary = {}
        bill_item_ids.forEach(bill_item_id => {
            const {
                // units = {},
                user_id
            } = billItems[bill_item_id]
            if (!userSummary[user_id]) userSummary[user_id] = []
            userSummary[user_id].push(bill_item_id)
            // if (units.denom !== 1 || !units.available?.length) userSummary.uneditable.push(bill_item_id)
        })
        return userSummary
    }
)