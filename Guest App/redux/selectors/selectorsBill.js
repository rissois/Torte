import { createSelector } from 'reselect'
import { recursiveFieldGetter } from '../../utils/functions/recursiveFieldGetter'
import { createShallowEqualSelector } from './selectorCreators'
import { selectBillGroups } from './selectorsBillGroups'
import { selectMyOrderSubtotal } from './selectorsBillUsers'
import { selectRestaurantGratuities } from './selectorsRestaurant2'
import { selectMyID } from './selectorsUser'

const emptyObject = {}
const emptyArray = []

export const selectBill = state => state.bill.bill ?? emptyObject

export const selectBillOrCollection = collection => createSelector(
    state => state.bill,
    bill => bill?.[collection || 'bill'] ?? emptyObject
)

export const selectDocumentFromBillCollection = (collection, id) => createSelector(
    selectBillOrCollection(collection),
    collection => collection?.[id] ?? emptyObject
)

export const selectNestedFieldFromBill = (...fields) => createSelector(
    selectBill,
    bill => recursiveFieldGetter(bill, ...fields)
)

export const selectNestedFieldFromBillCollection = (collection, id, ...fields) => createSelector(
    selectDocumentFromBillCollection(collection, id),
    document => recursiveFieldGetter(document, ...fields)
)

/*
    BASIC BILL DETAILS
*/

export const selectBillID = createSelector(
    selectBill,
    bill => bill?.id || ''
)

export const selectTableName = createSelector(
    selectBill,
    bill => bill?.table?.name || 'Unknown table'
)

export const selectBillCode = createSelector(
    selectBill,
    bill => bill?.bill_code || 'XXXX'
)

export const selectRestaurantID = createSelector(
    selectBill,
    bill => bill?.restaurant?.id || ''
)

export const selectIsBillOrderEnabled = createSelector(
    selectBill,
    bill => !!bill?.is_order_enabled
)

export const selectIsBillPayEnabled = createSelector(
    selectBill,
    bill => !!bill?.is_pay_enabled
)

export const selectRestaurantName = createSelector(
    selectBill,
    bill => bill?.restaurant?.name || '(restaurant name)'
)

export const selectIsMenuOnly = state => !state.trackers.bill_id

export const selectBillUserIDs = createSelector(
    selectBill,
    selectMyID,
    ({ user_ids = [] }, myID) => [myID, ...user_ids.filter(id => id !== myID)]
)

export const selectBillUserNames = createSelector(
    selectBill,
    ({ user_status = {} }) => Object.keys(user_status).reduce((acc, user_id) => ({ ...acc, [user_id]: user_status[user_id]?.name || 'unknown' }), {}) ?? emptyObject
)

export const selectIsUserAlreadyOrdered = createSelector(
    selectBill,
    selectMyID,
    ({ user_status = {} }, myID) => !!user_status[myID]?.order_total
)

export const selectIsOrderEnabled = createSelector(
    selectBill,
    ({ is_order_enabled = false }) => is_order_enabled
)

export const selectBillUserName = (user_id) => createShallowEqualSelector(
    selectMyID,
    selectBillUserNames,
    (myID, billUserNames) => myID === user_id ? 'You' : billUserNames[user_id] || ''
)

/*
    User bill details
*/

export const selectIsSoloBill = createShallowEqualSelector(
    selectBillUserIDs,
    selectMyID,
    (bill_user_ids, myID,) => bill_user_ids.length === 1 && bill_user_ids[0] === myID
)

export const selectIsUserPayingAll = createSelector(
    selectBill,
    selectMyID,
    (bill, myID,) => !!bill.pay_status?.claim_all?.[myID]
)

export const selectIsUserWithPriorOrder = createSelector(
    selectMyOrderSubtotal,
    userOrderSubtotal => !!userOrderSubtotal
)

/*
    Bill User statuses
*/

export const selectUserIDsWithCarts = createSelector(
    selectBillGroups,
    billGroups => Object.keys(billGroups).reduce((acc, bill_group_id) => {
        const user_id = billGroups[bill_group_id].user_id
        if (billGroups[bill_group_id].timestamps.itemized || billGroups[bill_group_id].timestamps.ordered || acc.includes(user_id)) return acc
        return [...acc, user_id]
    }, [])
)

export const selectUserIDsWithOrders = createSelector(
    selectBill,
    bill => bill.order_status?.user_ids ?? []
)

export const selectIsUserOnlyWithOrder = createShallowEqualSelector(
    selectMyID,
    selectUserIDsWithOrders,
    (myID, usersWithOrders) => usersWithOrders.length === 1 && usersWithOrders.includes(myID)
)

export const selectUserIDsWithoutCarts = createShallowEqualSelector(
    selectBillUserIDs,
    selectUserIDsWithCarts,
    selectUserIDsWithOrders,
    (billUserIDs, cartUserIDs, orderUserIDs) => billUserIDs.filter(user_id => !cartUserIDs.includes(user_id) && !orderUserIDs.includes(user_id))
)


/*
    BILL ORDER STATUS
*/

export const selectIsBillCartActive = createSelector(
    selectBill,
    ({ cart_status = {} }) => !!cart_status.bill_group_ids?.length
)


/*
    BILL PAYMENT STATUS
*/

export const selectIsBillUnpaid = createSelector(
    selectBill,
    ({ bill_item_status = {} }) => !!bill_item_status.ordered?.length || !!bill_item_status.claimed?.length
)

export const selectIsBillPartiallyClaimed = createSelector(
    selectBill,
    ({ bill_item_status = {} }) => !!bill_item_status.claimed?.length
)

export const selectIsBillPartiallyPaid = createSelector(
    selectBill,
    selectIsBillUnpaid,
    ({ bill_item_status = {} }, isBillUnpaid) => isBillUnpaid && !!bill_item_status.paid?.length
)

export const selectBillOrderSubtotal = createSelector(
    selectBill,
    ({ order_summary }) => order_summary?.subtotal || 0
)

export const selectBillPaidSubtotal = createSelector(
    selectBill,
    ({ paid_summary }) => paid_summary?.subtotal || 0
)

export const selectBillRemainingSubtotal = createSelector(
    selectBillOrderSubtotal,
    selectBillPaidSubtotal,
    (orderSubtotal, paidSubtotal) => orderSubtotal - paidSubtotal
)

export const selectIsBillStarted = createSelector(
    selectBill,
    ({ bill_item_status = {} }) => !!Object.values(bill_item_status).length
)

const selectIsBillAutomaticGratuityOn = createSelector(
    selectBill,
    bill => !!bill.gratuities?.is_automatic_gratuity_on
)

export const selectBillGratuities = createSelector(
    selectIsBillAutomaticGratuityOn,
    selectRestaurantGratuities,
    (is_automatic_gratuity_on, gratuities) => {
        if (!gratuities.is_tip_enabled) return [true]
        if (is_automatic_gratuity_on) {
            return [false, true, gratuities.automatic.default_option, gratuities.automatic.options, true]
        }
        const isPercentBased = gratuities.prompts.is_percent_based
        const prompt = gratuities.prompts[isPercentBased ? 'percent' : 'cents']
        return [false, false, prompt.default_option, prompt.options, isPercentBased, gratuities.prompts.is_no_tip_warned]
        // [isTipFree, isAutomaticTip, tipDefault, tipOptions, isTipInPercentages, isNoTipWarned]
    }
)