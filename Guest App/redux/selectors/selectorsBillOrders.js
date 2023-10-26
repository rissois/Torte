import { createSelector } from 'reselect'
import arrayToCommaList from '../../utils/functions/arrayToCommaList'
import { createShallowEqualSelector } from './selectorCreators'
import { selectBillOrCollection, selectBillUserNames, } from './selectorsBill'
import { selectMyID } from './selectorsUser'

const emptyObject = {}
const emptyArray = []

export const selectCurrentBillOrderID = state => state.bill?.bill?.order_status?.bill_order_id || null

export const selectCurrentBillOrder = createSelector(
    selectCurrentBillOrderID,
    selectBillOrCollection('billOrders'),
    (bill_order_id, billOrders) => billOrders[bill_order_id] || emptyObject
)

/*
    BASIC ORDER DETAILS
*/

export const selectIsOrderOccupied = createSelector(
    selectCurrentBillOrder,
    billOrder => !!billOrder.user_ids?.length
)

export const selectIsOrderReady = createSelector(
    selectCurrentBillOrder,
    billOrder => !!billOrder.timestamps?.ready
)

export const selectOrderLastActivityMillis = createSelector(
    selectCurrentBillOrder,
    billOrder => billOrder.timestamps?.last_activity?.toMillis()
)

export const selectOrderAutoPausedMillis = createSelector(
    selectCurrentBillOrder,
    billOrder => billOrder.timestamps?.auto_paused?.toMillis()
)

export const selectOrderReadyMillis = createSelector(
    selectCurrentBillOrder,
    billOrder => billOrder.timestamps?.ready?.toMillis()
)

export const selectOrderPausedUserID = createSelector(
    selectCurrentBillOrder,
    billOrder => billOrder.paused_user_id || ''
)

export const selectOrderWaitUserIDs = createSelector(
    selectCurrentBillOrder,
    billOrder => billOrder.wait_user_ids || emptyArray
)

export const selectIsOrderPaused = createSelector(
    selectOrderAutoPausedMillis,
    selectOrderPausedUserID,
    selectOrderWaitUserIDs,
    (auto_paused, paused_user_id, wait_user_ids) => !!auto_paused || !!paused_user_id || !!wait_user_ids?.length,
)

export const selectIsOrderWaiting = createSelector(
    selectOrderWaitUserIDs,
    wait_user_ids => !!wait_user_ids?.length,
)


/*
    ORDER USER DETAILS
*/

export const selectIsOrderWithUser = createSelector(
    selectCurrentBillOrder,
    selectMyID,
    ({ user_ids = [] }, user_id) => user_ids.includes(user_id)
)

export const selectIsOrderWaitingForUser = createSelector(
    selectOrderWaitUserIDs,
    selectMyID,
    (wait_user_ids, myID) => wait_user_ids.includes(myID)
)

export const selectIsOrderPausedByMe = createSelector(
    selectOrderPausedUserID,
    selectMyID,
    (paused_user_id, myID) => paused_user_id === myID
)


export const selectIsOrderForced = createSelector(
    selectCurrentBillOrder,
    ({ force_user_id }) => !!force_user_id
)

/*
    Order Bill Users
*/

export const selectOrderPausedUserName = createSelector(
    selectOrderPausedUserID,
    selectBillUserNames,
    (paused_user_id, billUserNames) => billUserNames[paused_user_id] || ''
)

export const selectOrderWaitUserNamesString = createShallowEqualSelector(
    selectOrderWaitUserIDs,
    selectBillUserNames,
    (wait_user_ids, billUserNames) => arrayToCommaList(wait_user_ids.map(user_id => billUserNames[user_id] || 'Missing name'))
)
