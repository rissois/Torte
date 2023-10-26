import { createSelector } from 'reselect'

const emptyObject = {}

export const selectBillOrders = state => state.selectBillOrders

export const selectBillOrder = bill_order_id => createSelector(
    selectBillOrders,
    billOrders => billOrders[bill_order_id] || emptyObject
)