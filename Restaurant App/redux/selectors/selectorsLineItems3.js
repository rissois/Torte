import { createSelector } from 'reselect'
import { createShallowEqualSelector } from './selectorCreators'
import { selectOpenBillsOnTable } from './selectorsTableStatus'

const emptyArray = []
const emptyObject = {}

const selectLineItems = state => state.lineItems ?? emptyObject


export const selectBillLineItems = bill_id => createSelector(
    selectLineItems,
    lineItems => lineItems[bill_id] ?? emptyObject
)

export const selectLineItem = (bill_id, lineItemID) => createSelector(
    selectBillLineItems(bill_id),
    billLineItems => billLineItems[lineItemID] ?? emptyObject
)

/*
BILL COMPONENT
*/

export const selectLineItemIDsForBill = bill_id => createSelector(
    selectBillLineItems(bill_id),
    billLineItems => Object.keys(billLineItems)
        .filter(lineItemID => billLineItems[lineItemID].isHandled)
        .sort((a, b) => billLineItems[a].position - billLineItems[b].position)
)

/*
ORDER COMPONENT
*/

export const selectLineItemsForOrder = bill_id => createShallowEqualSelector(
    selectBillLineItems(bill_id),
    billLineItems => {
        console.log('selectors')

        return Object.keys(billLineItems)
            .filter(lineItemID => !billLineItems[lineItemID].isHandled)
            .reduce((acc, lineItemID) => ({ ...acc, [lineItemID]: billLineItems[lineItemID] }), {})
    }
)

// export const selectLineItemIDsForOrder = bill_id => createSelector(
//     selectBillLineItems(bill_id),
//     billLineItems => Object.keys(billLineItems)
//         .filter(lineItemID => !billLineItems[lineItemID].isHandled)
//         .sort((a, b) => billLineItems[a].position - billLineItems[b].position)
// )

// export const selectLineItemsForTable = table_id => {
//     selectOpenBillsOnTable(table_id),
//         selectLineItems,
//         (openBills, lineItems) => openBills.reduce((acc, bill_id) => {
//             if (!lineItems[bill_id]) return { ...acc, [bill_id]: emptyObject }
//             return { ...acc, [bill_id]: lineItems[bill_id] }
//         }, {})
// }