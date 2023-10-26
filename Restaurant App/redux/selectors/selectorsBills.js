import { createSelector } from 'reselect'
import { firstAndL, } from '../../utils/functions/names'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'
import { selectLineItemsOnOrder } from './selectorsLineItems4'

const emptyObject = {}
const emptyArray = []

const selectBills = state => state.bills

export const selectBillsNumberUnpaid = createSelector(
    selectBills,
    bills => Object.keys(bills).reduce((count, bill_id) => count + !!bills[bill_id].timestamps?.unpaid, 0)
)

export const selectBill = bill_id => createSelector(
    selectBills,
    bills => bills[bill_id] ?? emptyObject
)

export const selectBillCode = bill_id => createSelector(
    selectBill(bill_id),
    bill => bill.bill_code
)

export const selectBillIsOccupied = bill_id => createSelector(
    selectBill(bill_id),
    bill => !!bill.user_ids?.length
)

export const selectBillIsRecoverable = bill_id => createSelector(
    selectBill(bill_id),
    bill => Object.keys(bill.user_status ?? {}).some(user_id => bill.user_status[user_id].order_total)
)

export const selectBillIsOrdered = bill_id => createSelector(
    selectBill(bill_id),
    bill => !!Object.values(bill.bill_item_status ?? {}).some(arr => arr.length)
)

export const selectBillIsWithCarts = bill_id => createSelector(
    selectBill(bill_id),
    bill => !!bill.cart_status?.bill_group_ids?.length
)

export const selectBillIsOrderEnabled = bill_id => createSelector(
    selectBill(bill_id),
    bill => !!bill.is_order_enabled
)

export const selectBillIsOrderCreated = bill_id => createSelector(
    selectBill(bill_id),
    bill => !!bill.order_status?.bill_order_id
)

export const selectBillIsWithOrder = (bill_id) => createSelector(
    selectLineItemsOnOrder(bill_id),
    lineItems => !!Object.keys(lineItems).length
)

export const selectBillIsWithItems = (bill_id) => createSelector(
    selectBill(bill_id),
    ({ bill_item_status }) => !!bill_item_status?.ordered?.length || !!bill_item_status?.claimed?.length || !!bill_item_status?.paid?.length || !!bill_item_status?.voided?.length
)

export const selectBillIsCheckingOut = bill_id => createSelector(
    selectBill(bill_id),
    bill => !!bill.bill_item_status?.claimed?.length
)

export const selectBillIsPartiallyPaid = bill_id => createSelector(
    selectBill(bill_id),
    bill => !!bill.bill_item_status?.paid?.length
)

export const selectBillIsPaid = bill_id => createSelector(
    selectBill(bill_id),
    bill => !!bill.order_summary?.subtotal && bill.paid_summary?.total >= bill.order_summary?.total
)

/*
  PRIORITIES: order waiting, order paused, paid, is ordering
  MAIN TEXT
*/
export const selectBillStatus = bill_id => createSelector(
    selectBillIsOccupied(bill_id),
    selectBillIsOrderEnabled(bill_id),
    selectBillIsOrdered(bill_id),
    selectBillIsWithCarts(bill_id),
    selectBillIsOrderCreated(bill_id),
    selectBillIsWithOrder(bill_id),
    selectBillIsCheckingOut(bill_id),
    selectBillIsPartiallyPaid(bill_id),
    selectBillIsPaid(bill_id),
    (isOccupied, isOrderEnabled, isOrdered, isWithCarts, isOrderCreated, isWithOrder, isCheckingOut, isPartiallyPaid, isPaid) => {
        let text = []

        if (isWithOrder) {
            text.push('Order waiting')

            if (isOrderCreated) text.push('New order started')
            else if (isWithCarts) text.push('Selecting items')

            if (isPaid) text.push('Already paid')
            else if (isCheckingOut) text.push('Checking out')
        }


        else if (isOrderCreated) {
            text.push('New order started')

            if (isWithCarts) text.push('Selecting more items')

            if (isPaid) text.push('Already paid')
            else if (isCheckingOut) text.push('Checking out')
        }

        else if (isPaid) {
            text.push('Fully paid')

            if (isWithCarts) text.push('Selecting items')
        }

        else if (isPartiallyPaid) {
            text.push('Partially paid')

            if (isWithCarts) text.push('Selecting items')
        }

        else if (isCheckingOut) {
            text.push('Checking out')

            if (isWithCarts) text.push('Other items in cart')
        }

        else if (isWithCarts) {
            if (isOrdered) text.push('Selecting more items')
            else text.push('Selecting items')
        }

        else if (isOrdered) {
            text.push('Already ordered')
            if (!isOrderEnabled && isOccupied) text.push('Opened Torte')
        }

        else if (isOccupied) text.push('Opened Torte')

        else text.push('No activity')

        return text.join('\n')
    }
)

export const selectBillUserIDs = (bill_id) => createSelector(
    selectBill(bill_id),
    bill => bill.user_ids ?? emptyArray
)

export const selectBillUserName = (bill_id, user_id) => createSelector(
    selectBill(bill_id),
    bill => firstAndL(bill.user_status?.[user_id]?.name)
)

export const selectBillUserStatuses = (bill_id) => createSelector(
    selectBill(bill_id),
    bill => bill.user_status ?? emptyObject
)

export const selectNestedFieldFromBill = (bill_id, ...fields) => createSelector(
    selectBill(bill_id),
    bill => recursiveFieldGetter(bill, ...fields)
)



/*
    'Fully paid'
    'Checking out'
    'Adding more'
    'Already ordered'
    'About to order'
    'Order paused'
    'Creating order'
    'Opened Torte'
*/