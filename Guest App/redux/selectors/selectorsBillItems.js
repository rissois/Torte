import { createSelector } from 'reselect'
import { selectBillUserNames } from './selectorsBill'
import { selectMyID } from './selectorsUser'

const emptyObject = {}
const emptyArray = []

export const selectBillItems = state => state.bill.billItems

export const selectBillItem = (bill_item_id) => createSelector(
    selectBillItems,
    billItems => billItems[bill_item_id] ?? emptyObject
)



export const selectBillItemSplitDetails = (bill_item_id) => createSelector(
    selectBillItem(bill_item_id),
    selectMyID,
    (billItem, myID) => [
        billItem.name,
        billItem.captions?.one_line || '',
        billItem.summary?.subtotal || 0,
        billItem.units?.denom || 1,
        billItem.units?.available.length || 0,
        billItem.units?.claimed[myID]?.length || 0,
        billItem.units?.paid[myID]?.length || 0,
        billItem.units?.claimed[myID]?.reduce((acc, { subtotal }) => acc + subtotal, 0) || 0,
        billItem.units?.paid[myID]?.reduce((acc, { subtotal }) => acc + subtotal, 0) || 0,
    ]

    /*
    [name, caption, subtotal, denom,  availableLength, myClaimedLength, myPaidLength, myClaimedSubtotal, myPaidSubtotal]
    */
)

export const selectBillItemsByUser = createSelector(
    selectBillItems,
    selectBillUserNames,
    selectMyID,
    (billItems = {}, billUserNames = {}, myID = '',) => {

        let billItemsByUser = {}

        Object.keys(billItems)
            .sort((a, b) => billItems[a].position - billItems[b].position)
            .forEach(bill_item_id => {
                const billItem = billItems[bill_item_id]
                const user_id = billItem.user_id || 'server'

                if (!billItemsByUser[user_id]) {
                    billItemsByUser[user_id] = { data: [], isClaimAllDisabled: true, isClaimAllAvailable: false }
                }
                billItemsByUser[user_id].data.push(billItem.id)

                if (billItem.units?.available.length) {
                    billItemsByUser[user_id].isClaimAllAvailable = true
                    billItemsByUser[user_id].isClaimAllDisabled = false
                }
                else if (billItem.units?.claimed[myID]?.length) {
                    billItemsByUser[user_id].isClaimAllDisabled = false
                }

            })

        return Object.keys(billItemsByUser)
            .sort(user_id => user_id === myID ? -1 : user_id === 'server' ? -1 : 1)
            .map(user_id => {
                return {
                    user_id: user_id,
                    name: user_id === myID ? 'Your' : user_id === 'server' ? 'Server-added' : billUserNames[user_id] + "'s" || 'Unknown',
                    ...billItemsByUser[user_id]
                }
            }) || emptyArray
    }
)

export const selectPayStatus = createSelector(
    selectBillItems,
    selectMyID,
    (billItems, myID) => {
        let isPayingBillRemainder = true
        let isPayingMyRemainder = true
        let isPayingServerRemainder = true
        let isBillWithServerItems = false

        for (const bill_item_id in billItems) {
            const billItem = billItems[bill_item_id]

            if (billItem.user_id === 'server') isBillWithServerItems = true
            if (billItem.units.available.length || Object.keys(billItem.units.claimed).filter(user_id => user_id !== myID).length) {
                isPayingBillRemainder = false
                if (billItem.user_id === myID) isPayingMyRemainder = false
                else if (billItem.user_id === 'server') isPayingServerRemainder = false
            }

            // early ejection
            if (isBillWithServerItems && !isPayingBillRemainder && !isPayingMyRemainder && !isPayingServerRemainder) return [isPayingBillRemainder, isPayingMyRemainder, isPayingServerRemainder, isBillWithServerItems]
        }

        return [isPayingBillRemainder, isPayingMyRemainder, isPayingServerRemainder, isBillWithServerItems]
    }
)

export const selectBillItemsClaimAll = (bill_item_ids = []) => createSelector(
    selectBillOrCollection('billItems'),
    selectMyID,
    (billItems, myID) => {
        let isAvailable = false
        let isDisabled = true

        for (const bill_item_id of bill_item_ids) {
            const units = billItems[bill_item_id]?.units

            if (units?.available.length) {
                isAvailable = true
                isDisabled = false
                break;
            }

            if (isDisabled && units?.claimed[myID]?.length) {
                isDisabled = false
            }
        }

        return [isAvailable, isDisabled]
    }
)



/*
export const selectBillItemName = createSelector(
    selectBillItem(bill_item_id),
    billItem => billItem.name || ''
)

export const selectBillItemCaption = createSelector(
    selectBillItem(bill_item_id),
    billItem => billItem.caption || ''
)

export const selectBillItemSubtotal = createSelector(
    selectBillItem(bill_item_id),
    billItem => billItem.subtotal || 0
)

export const selectBillItemDenom = createSelector(
    selectBillItem(bill_item_id),
    billItem => billItem.units?.denom || 1
)

export const selectBillItemAvailableLength = createSelector(
    selectBillItem(bill_item_id),
    billItem => billItem.units?.available.length || 0
)

export const selectBillItemMyClaimLength = createSelector(
    selectBillItem(bill_item_id),
    selectMyID,
    (billItem, myID) => billItem.units?.available.length || 0
)
*/