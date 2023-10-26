/** 
* Line items
* 
* Groups bill items for servers
* [bill_id]: {
*   bill: {
*       [lineItemID]: {...billItem, bill_item_ids}
*   },
*   order: {
*       [lineItemID]: {...billItem, bill_item_ids}
*   }}
* 
* Bill: Displayed as-is
* BillItem: Break down line item into constituent bill_item_ids
* Order: Display existing bill_item_ids, separately monitor incoming bill_item_ids under same lineItemID
*
* An item part of an ORDER when ordered by a user and not marked as voided, marked, or printed
* 
**/

import firebase from "firebase"

const initialLineItems = {}

const findMatchingPlacement = (billItem, lineItems) => Object.keys(lineItems).find(lineItemID => isMatchingLineItem(billItem, lineItems[lineItemID]))
const findExistingPlacement = (bill_item_id, lineItems) => Object.keys(lineItems).find(lineItemID => lineItems[lineItemID].bill_item_ids.includes(bill_item_id))

export const isMatchingLineItem = (item1, item2) => item1.reference_ids.item_id === item2.reference_ids.item_id
    && item1.reference_ids.variant_id === item2.reference_ids.variant_id
    && item1.tax_rate.id === item2.tax_rate.id
    && item1.voided.is_voided === item2.voided.is_voided
    && item1.name === item2.name
    && item1.captions.line_break === item2.captions.line_break // quick check of the items size, filters, modifiers, and upsells
    && item1.summary.subtotal === item2.summary.subtotal
    && !!item1.timestamps.printed === !!item2.timestamps.printed
    && !!item1.timestamps.marked === !!item2.timestamps.marked

const addOrCreateLineItem = (lineItems, bill_id, bin, matchingLineItemID, billItem) => {
    if (matchingLineItemID) {
        lineItems[bill_id] = {
            ...lineItems[bill_id],
            [bin]: {
                ...lineItems[bill_id][bin],
                [matchingLineItemID]: {
                    ...lineItems[bill_id][bin][matchingLineItemID],
                    bill_item_ids: [...lineItems[bill_id][bin][matchingLineItemID].bill_item_ids, billItem.id]
                }
            }
        }
    }
    else {
        lineItems[bill_id] = {
            ...lineItems[bill_id],
            [bin]: {
                ...lineItems[bill_id][bin],
                [(firebase.firestore().collection('fake').doc()).id]: { ...billItem, bill_item_ids: [billItem.id] }
            }
        }
    }
}

const removeLineItem = (lineItems, bill_id, bin, existingLineItemID, bill_item_id) => {
    if (lineItems[bill_id][bin][existingLineItemID].bill_item_ids.length === 1) {
        const { [existingLineItemID]: discard, ...rest } = { ...lineItems[bill_id][bin] }
        lineItems[bill_id] = {
            ...lineItems[bill_id],
            [bin]: rest
        }
    }
    else lineItems[bill_id] = {
        ...lineItems[bill_id],
        [bin]: {
            ...lineItems[bill_id][bin],
            [existingLineItemID]: {
                ...lineItems[bill_id][bin][existingLineItemID],
                bill_item_ids: lineItems[bill_id][bin][existingLineItemID].bill_item_ids.filter(id => id !== bill_item_id)
            }
        }
    }
}


export default function lineItems(state = initialLineItems, action) {
    switch (action.type) {
        case 'bills/DELETE_BILLS_TEMP':
        case 'bills/DELETE_BILLS': {
            const lineItems = { ...state }
            Object.keys(action.obj).forEach(id => delete lineItems[id])
            return lineItems
        }

        case 'billItems/SET_BILLITEMS':
        case 'billItems/SET_BILLITEMS_TEMP': {
            let lineItems = { ...state }
            let isAltered = false

            Object.keys(action.obj).forEach(bill_item_id => {
                const billItem = action.obj[bill_item_id]
                const { bill_id } = billItem

                if (!lineItems[bill_id]) lineItems[bill_id] = { bill: {}, order: {} }

                const displayOnBillScreen = !!(billItem.timestamps.marked || billItem.timestamps.printed || billItem.voided.is_voided || billItem.user_id === 'server')

                const bin = displayOnBillScreen ? 'bill' : 'order'
                let existingLineItemID = findExistingPlacement(bill_item_id, lineItems[bill_id][bin])
                let matchingLineItemID = findMatchingPlacement(billItem, lineItems[bill_id][bin])

                if (existingLineItemID && existingLineItemID === matchingLineItemID) return

                isAltered = true


                addOrCreateLineItem(lineItems, bill_id, bin, matchingLineItemID, billItem)

                if (existingLineItemID) removeLineItem(lineItems, bill_id, bin, existingLineItemID, bill_item_id)
                else {
                    const nonBin = displayOnBillScreen ? 'order' : 'bill'

                    existingLineItemID = findExistingPlacement(bill_item_id, lineItems[bill_id][nonBin])
                    if (existingLineItemID) removeLineItem(lineItems, bill_id, nonBin, existingLineItemID, bill_item_id)
                }
            })

            if (isAltered) return lineItems
            return state
        }
        case 'billItems/DELETE_BILLITEMS': {
            let lineItems = { ...state }
            let isAltered = false

            Object.keys(action.obj).forEach(bill_item_id => {
                const billItem = action.obj[bill_item_id]
                const { bill_id } = billItem
                if (!lineItems[bill_id]) return

                const displayOnBillScreen = !!(billItem.timestamps.marked || billItem.timestamps.printed || billItem.voided.is_voided || billItem.user_id === 'server')

                const bin = displayOnBillScreen ? 'bill' : 'order'
                let existingLineItemID = findExistingPlacement(bill_item_id, lineItems[bill_id][bin])

                if (existingLineItemID) {
                    isAltered = true
                    removeLineItem(lineItems, bill_id, bin, existingLineItemID, bill_item_id)
                }
                else {
                    const nonBin = displayOnBillScreen ? 'order' : 'bill'
                    existingLineItemID = findExistingPlacement(bill_item_id, lineItems[bill_id][nonBin])
                    if (existingLineItemID) {
                        isAltered = true
                        removeLineItem(lineItems, bill_id, nonBin, existingLineItemID, bill_item_id)
                    }
                }
            })

            if (isAltered) return lineItems

            return state
        }
        case 'app/RESET':
            return initialLineItems
        default:
            return state;
    }
}

