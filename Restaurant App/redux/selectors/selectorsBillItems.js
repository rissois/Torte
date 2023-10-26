import { createSelector } from 'reselect'
import arrayToCommaList from '../../utils/functions/arrayToCommaList'

const emptyObject = {}
const emptyArray = []
const failedSize = { code: '', name: '', price: 0 }

export const initialFilters = {
    vegetarian: {
        name: 'Vegetarian'
    },
    pescatarian: {
        name: 'Pescatarian'
    },
    vegan: {
        name: 'Vegan'
    },

    shellfish_free: {
        name: 'Shellfish-free'
    },
    dairy_free: {
        name: 'Dairy-free'
    },
    peanut_free: {
        name: 'Peanut-free'
    },
    treenut_free: {
        name: 'Tree nut-free'
    },
    egg_free: {
        name: 'Egg-free'
    },
    gluten_free: {
        name: 'Gluten-free'
    },
    sesame_free: {
        name: 'Sesame-free'
    },
}


export const selectBillItemsFromBill = bill_id => createSelector(
    state => state.billItems,
    byBill => byBill[bill_id] ?? emptyObject
)

export const selectBillItemsUserSummaries = bill_id => createSelector(
    selectBillItemsFromBill(bill_id),
    billItems => {
        let users = {}
        Object.keys(billItems).forEach(bill_item_id => {
            const { user_id, summary: { subtotal } = {} } = billItems[bill_item_id]
            if (!users[user_id]) users[user_id] = { subtotal: 0, items: 0 }
            users[user_id].subtotal += subtotal
            users[user_id].items++
        })
        return users
    }
)

// This can more easily be done through a 
export const selectBillUserClaimSummaries = bill_id => createSelector(
    selectBillItemsFromBill(bill_id),
    billItems => {
        let users = {}
        Object.keys(billItems).forEach(bill_item_id => {
            const { units: { claimed } } = billItems[bill_item_id]
            Object.keys(claimed).forEach(user_id => {
                if (!users[user_id]) users[user_id] = 0
                claimed[user_id].forEach(unit => users[user_id] += unit.subtotal + unit.tax)
            })
        })
        return users
    }
)

export const selectBillItemIDsReprint = bill_id => createSelector(
    selectBillItemsFromBill(bill_id),
    byBill => Object.keys(byBill)
        .filter(bill_item_id => !byBill[bill_item_id].voided.is_voided
            && (byBill[bill_item_id].user_id === 'server' || byBill[bill_item_id].timestamps.marked || byBill[bill_item_id].timestamps.printed))
        .sort((a, b) => {
            const compared = byBill[a].position.localeCompare(byBill[b].position)
            if (compared) return compared
            const isAHandled = !!(byBill[a].timestamps.marked || byBill[a].timestamps.printed)
            const isBHandled = !!(byBill[b].timestamps.marked || byBill[b].timestamps.printed)
            if (isAHandled === isBHandled) return 0
            if (isAHandled) return 1
            return -1
        })
)

export const selectCompableBillItemIDs = bill_id => createSelector(
    selectBillItemsFromBill(bill_id),
    billItems => Object.keys(billItems).filter(key => !billItems[key]?.voided?.is_voided).sort((a, b) => billItems[a].position.localeCompare(billItems[b].position))
)

export const selectBillItem = (bill_id, bill_item_id) => createSelector(
    selectBillItemsFromBill(bill_id),
    billItems => billItems[bill_item_id] ?? emptyObject
)

export const selectBillItemSize = (bill_id, bill_item_id) => createSelector(
    selectBillItem(bill_id, bill_item_id),
    billItem => billItem.size ?? failedSize
)

export const selectBillItemFilters = (bill_id, bill_item_id) => createSelector(
    selectBillItem(bill_id, bill_item_id),
    billItem => billItem.filters ?? emptyObject
)

export const selectBillItemModifiers = (bill_id, bill_item_id) => createSelector(
    selectBillItem(bill_id, bill_item_id),
    billItem => billItem.modifiers ?? emptyObject
)

export const selectBillItemUpsells = (bill_id, bill_item_id) => createSelector(
    selectBillItem(bill_id, bill_item_id),
    billItem => billItem.upsells ?? emptyArray
)

export const selectBillItemCustom = (bill_id, bill_item_id) => createSelector(
    selectBillItem(bill_id, bill_item_id),
    billItem => billItem.custom ?? emptyArray
)

const emptyComped = { subtotal: 0, percent: 0, is_comped: false, tax: 0, }
export const selectBillItemComped = (bill_id, bill_item_id) => createSelector(
    selectBillItem(bill_id, bill_item_id),
    billItem => billItem.comped ?? emptyComped
)

export const selectBillItemComment = (bill_id, bill_item_id) => createSelector(
    selectBillItem(bill_id, bill_item_id),
    billItem => billItem.comment ?? ''
)

export const selectBillItemIsEditable = (bill_id, bill_item_id) => createSelector(
    selectBillItem(bill_id, bill_item_id),
    billItem => (billItem.units?.denom === 1 && (billItem.units?.available?.length === 1 || billItem.voided.is_voided)) ?? false
)