import { createSelector } from 'reselect'
import { createShallowEqualSelector } from './selectorCreators'

const emptyArray = []
const emptyObject = {}


export const selectLineItemsByBillAndType = (bill_id, isHandled) => createSelector(
    selectLineItemsByBill(bill_id),
    lineItems => lineItems[isHandled ? 'handled' : 'unhandled'] || emptyArray
)

export const selectLineItemsByBill = bill_id => createSelector(
    state => state.lineItems,
    lineItems => lineItems?.[bill_id] || emptyObject
)

export const selectHandledLineItemsByBill = bill_id => createSelector(
    state => state.lineItems,
    test => test[bill_id]?.filter(lineItem => lineItem.isHandled) || emptyArray
)

export const selectUnhandledLineItemsByBill = bill_id => createShallowEqualSelector(
    selectLineItemsByBill(bill_id),
    billLineItems => {
        console.log('selectorsLineItems selectUnhandledLineItemsByBill: ', bill_id)

        return billLineItems?.filter(lineItem => !lineItem.isHandled) || emptyArray
    }
)

// export const selectUnhandledLineItemsByTable = table_id => createShallowEqualSelector(
//     selectOpenBillsOnTable(table_id),
//     state => state.lineItems,
//     (openBillsOnTable, lineItemsByBill) => {
//         let unhandledItemsByBill = {}

//         openBillsOnTable.forEach(bill_id => {
//             const unhandledItems = lineItemsByBill[bill_id].filter(lineItem => !lineItem.isHan)
//         })

//         byBill[bill_id]?.filter(lineItem => !lineItem.isHandled) || emptyArray
//     }
// )