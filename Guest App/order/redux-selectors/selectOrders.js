import { createSelector } from 'reselect'
import { selectMyID } from '../../redux/selectors/selectorsUser'
import arrayToCommaList from '../../utils/functions/arrayToCommaList'
import { firstAndL } from '../../utils/functions/names'

/*
DO A SEARCH AND REMOVE ANY NOT USED
*/

const emptyObject = {}
const emptyArray = []

// export const selectCurrentOrder = createSelector(
//     state => state.bill.bill.
// )

export const selectIsSolo = createSelector(
    selectMyID,
    state => state.bill.bill?.user_ids,
    (myID = '', user_ids = []) => user_ids.length === 1 && user_ids[0] === myID
)

export const selectCurrentOrder = createSelector(
    state => state.bill.bill?.order_status?.bill_order_id,
    state => state.bill.billOrders,
    (bill_order_id, billOrders) => billOrders?.[bill_order_id] || emptyObject
)

export const selectIsUserInOrder = createSelector(
    selectMyID,
    selectCurrentOrder,
    (myID, billOrder) => !!(billOrder.user_ids?.includes(myID))
)

export const selectIsOrderWaitingForMe = createSelector(
    selectMyID,
    selectCurrentOrder,
    (myID, billOrder) => !!(billOrder.wait_user_ids?.includes(myID))
)

export const selectOrderStatuses = createSelector(
    selectCurrentOrder,
    (billOrder) => [
        !!billOrder.user_ids?.length, // isOrderOccupied
        !!billOrder.timestamps?.ready, // isOrderReady
        !!billOrder.paused_user_id || !!billOrder.wait_user_ids?.length, // isOrderPaused
    ]
)

export const selectOrderUsers = createSelector(
    selectCurrentOrder,
    state => state.bill.billUsers,
    (billOrder, billUsers) => [
        billOrder.user_ids, // orderUsers
        billOrder.paused_user_id && firstAndL(billUsers[billOrder.paused_user_id]?.name), // orderPausedUser
        arrayToCommaList(billOrder.wait_user_ids?.map(id => firstAndL(billUsers[id]?.name))), // orderWaitingUsers
    ]
)

export const selectOrderTimes = createSelector(
    selectCurrentOrder,
    (billOrder) => [
        billOrder.timestamps?.ready?.toMillis(), // orderReadyTime
        billOrder.timestamps?.last_activity?.toMillis(), // orderLastActivityTime
    ]
)