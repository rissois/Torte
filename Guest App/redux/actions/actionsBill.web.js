// Heavily redundanct with actionsRestaurant.js

import { collection, doc, getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { transactPauseBillOrderToggle, transactWaitBillOrderToggle } from "../../menu/transactions/transactBillOrder"
import calculateTimeRemaining from "../../utils/functions/calculateTimeRemaining"
import { firstAndL } from "../../utils/functions/names"
import { handleQuery, handleSnapshot } from "../functions/actionHelpers"
import { initialMenuTrackers } from "../reducers/reducerTrackers"
import { doAlertAdd } from "./actionsAlerts"
import { doAppStripeProviderClear, doAppStripeProviderSet, doAppStripeTestModeSet } from "./actionsApp"
// import { doErrorThrown } from "./actionsAlerts"
import { doListenerStarted, doListenerChildrenUnsubscribe } from "./actionsListeners"
import { doTrackersClear, doTrackersSet } from "./actionsTrackers"
import firebaseApp from '../../firebase/firebase'
import { navigationReset } from '../../navigators/functions/AppNavigation'
import { doRestaurantMenuStart, doRestaurantStart } from './actionsRestaurants.web'

const auth = getAuth(firebaseApp)
const firestore = getFirestore(firebaseApp)

const PAUSE_2_MINUTES = 120000
const READY_20_SECONDS = 20000

const warnNewOrReadyOrder = (dispatch, modifiedOrder, originalOrder = {}, user_status = {}) => {
    const myID = auth.currentUser.uid
    const {
        restaurant_id,
        bill_id,
        user_ids = [],
        timestamps: { auto_paused, ready } = {},
        is_pos_readied,
        force_user_id
    } = modifiedOrder
    const {
        user_ids: originalUserIDs = [],
        wait_user_ids: originalWaitUserIDs = [],
    } = originalOrder

    // Alert ALL users for forced orders
    if (force_user_id && myID !== force_user_id) {
        let forceUserName = user_status[force_user_id]?.name
        forceUserName = forceUserName ? firstAndL(forceUserName) : 'A user'

        dispatch(doAlertAdd(`${forceUserName} has forced the order`, [
            'We recommend all orders are placed together so food is prepared at the same time',
            user_ids.includes(myID) ? 'Pause the order?' : 'Request the order wait for you?'
        ], [
            {
                text: 'Yes, pause order',
                onPress: async () => {
                    try {
                        if (user_ids.includes(myID)) {
                            await transactPauseBillOrderToggle(restaurant_id, bill_id, true)
                            dispatch(doAlertAdd('Order is paused', ['This order is paused until you unpause it or someone forces the order through.', 'Anyone can select one or more of their items to get started ASAP if they\'d like.']))
                        }
                        else {
                            await transactWaitBillOrderToggle(restaurant_id, bill_id, true)
                            dispatch(doAlertAdd('We are holding this order for you', ['This order will wait for 5 minutes of inactivity before it is sent to the server', 'You can undo this wait if you want your friend(s) items to be prepared without yours.']))
                        }
                    }
                    catch (error) {
                        dispatch(doAlertAdd('Unable to pause order', ['You request may have come in too late.', 'Please try again or talk to your server if you need to change the order.']))
                    }
                    finally {
                        dispatch(doBillOrderResponded(ready.toMillis()))
                    }
                }
            },
            {
                text: 'Do not pause',
                onPress: () => dispatch(doBillOrderResponded(ready.toMillis()))
            }
        ]
        ))
    }
    // Otherwise, alert users NOT on the order
    else if (!user_ids.includes(myID)) {
        if (originalWaitUserIDs.includes(myID) && !is_pos_readied) {
            // If the pos was NOT responsible for making this order ready
            // And you were on wait list
            // Then you LEAVING the wait list must have caused it. Therefore, do not alert.
        }
        else {
            let subtext = [`An order has been ${originalUserIDs.includes(myID) ? 'resumed' : 'started'}. Everyone at a table should submit their orders together.`, 'Do need extra time to finish your order?']
            const autoPaused = calculateTimeRemaining(auto_paused, PAUSE_2_MINUTES) > 0
            if (autoPaused) subtext.push(`(you will only have ${Math.round((autoPaused + READY_20_SECONDS) / 1000)} seconds to change your mind)`)
            const timeOfAlert = Math.max(ready?.toMillis() || 0, auto_paused?.toMillis() || 0)
            dispatch(doAlertAdd('Are you going to order?', subtext, [
                {
                    text: 'Yes, let me finish my order',
                    onPress: async () => {
                        try {
                            await transactWaitBillOrderToggle(restaurant_id, bill_id, true)
                            dispatch(doAlertAdd('We are holding this order for you', ['This order will wait for 5 minutes of inactivity before it is sent to the server', 'You can undo this wait if you want your friend(s) items to be prepared without yours.']))
                        }
                        catch (error) {
                            console.log('wait order error: ', error)
                            dispatch(doAlertAdd('Unable to wait', ['Your request may have come too late.', 'Please try again or talk to your server if you need to change the order.']))
                        }
                        finally {
                            dispatch(doBillOrderResponded(timeOfAlert))
                        }
                    }
                },
                {
                    text: "No, I won't order now",
                    onPress: () => dispatch(doBillOrderResponded(timeOfAlert))
                }
            ]))
        }
    }
}

export const doBillStart = (restaurant_id, bill_id, isBillNewToUser) => {
    return async function (dispatch, getState) {
        const billRef = doc(firestore, 'Restaurants', restaurant_id, 'Bills', bill_id)
        const errorCallback = category => error => {
            console.log('actionsUser error: ', category, error.message)
            dispatch(doAlertAdd('Error retrieving ' + category, 'Please exit and try again'))
        }

        dispatch(doTrackersSet({ restaurant_id, bill_id, ...initialMenuTrackers }))

        dispatch(doListenerStarted('bill', 'bill',
            handleSnapshot(
                billRef,
                data => {
                    dispatch(doBillChildrenUpdate('bill', data))
                    dispatch(doAppStripeTestModeSet(data.is_test))

                    dispatch(doRestaurantStart(restaurant_id,))

                    if (data.timestamps.closed) {
                        navigationReset([
                            { name: 'Home' },
                            { name: 'Bill' },
                        ])
                    }
                    else {
                        if (data.is_order_enabled) dispatch(doRestaurantMenuStart(restaurant_id))

                        if (data.is_order_enabled && !data.order_summary.total && isBillNewToUser) {
                            navigationReset([
                                { name: 'Home' },
                                { name: 'Order' },
                                { name: 'Menu' },
                                { name: 'QR', params: { isFirst: true } }
                            ])
                        }
                        else {
                            navigationReset([
                                { name: 'Home' },
                                { name: 'Order' }
                            ])
                        }

                        if (data.timestamps.unpaid) {
                            // inform time? new Date(data.timestamps.unpaid.toDate().getTime() + CHARGE_DELAY * 6000)
                            dispatch(doAlertAdd('Bill was marked as unpaid', 'Please ensure all items are paid for to avoid a charge.'))
                        }
                    }
                },
                data => {
                    dispatch(doBillChildrenUpdate('bill', data))
                    dispatch(doAppStripeTestModeSet(data.is_test))
                    if (data.timestamps.unpaid && getState().bill?.bill?.timestamps?.unpaid === null) {
                        dispatch(doAlertAdd('Bill was marked as unpaid', 'Please ensure all items are paid for to avoid a charge, or speak to a server if this was a mistake.'))
                    }
                    else if (data.timestamps.closed && getState().bill?.bill?.timestamps?.closed === null) {
                        dispatch(doAlertAdd('Bill was closed', 'Please speak to the server if this was a mistake'))
                    }
                },
                errorCallback('this bill'),
                () => {
                    dispatch(doAlertAdd('Could not load restaurant'))
                    dispatch(doBillEnd())
                }
            )))

        dispatch(doListenerStarted('bill', 'billGroups',
            handleQuery(
                collection(billRef, 'BillGroups'),
                undefined,
                obj => dispatch(doBillChildrenUpdate('billGroups', obj)),
                obj => dispatch(doBillChildrenDelete('billGroups', obj)),
                errorCallback('your cart'),
            )))

        dispatch(doListenerStarted('bill', 'billOrders',
            handleQuery(
                collection(billRef, 'BillOrders'),
                undefined,
                obj => {
                    const modifiedOrder = Object.values(obj).find(billOrder => !billOrder.timestamps.completed)
                    if (modifiedOrder) {
                        const responded_to_order = getState().firestore.responded_to_order
                        const { ready, auto_paused, created } = modifiedOrder.timestamps
                        const createdMillis = created?.toMillis() ?? 0
                        const autoPausedMillis = auto_paused?.toMillis() ?? 0
                        const readyMillis = ready?.toMillis() ?? 0
                        if (responded_to_order && modifiedOrder.is_pos_readied && (readyMillis - createdMillis < 180000)) {
                            // Do not warn if user already responded to the auto_pause
                            // Identifiable by is_pos_readied
                            // And the ready occurring less than 5 minutes from the autopause (a wait lasts 5 minutes)
                        }
                        else if (autoPausedMillis > responded_to_order || readyMillis > responded_to_order) {
                            dispatch(doBillOrderResponded(Infinity)) // Prevent repeated alerts until response recieved
                            warnNewOrReadyOrder(dispatch, modifiedOrder, getState().bill?.billOrders?.[modifiedOrder.id], getState().bill?.bill?.user_status)
                        }
                    }
                    else {
                        dispatch(doBillOrderResponded(0))
                    }

                    dispatch(doBillChildrenUpdate('billOrders', obj))
                },
                obj => dispatch(doBillChildrenDelete('billOrders', obj)),
                errorCallback('bill orders'),
            )))

        dispatch(doListenerStarted('bill', 'billItems',
            handleQuery(
                collection(billRef, 'BillItems'),
                [['voided.is_voided', '==', false]],
                obj => dispatch(doBillChildrenUpdate('billItems', obj)),
                obj => dispatch(doBillChildrenDelete('billItems', obj)),
                errorCallback('bill items'),
            )))

        dispatch(doListenerStarted('bill', 'billUsers',
            handleQuery(
                collection(billRef, 'BillUsers'),
                undefined,
                obj => dispatch(doBillChildrenUpdate('billUsers', obj)),
                obj => dispatch(doBillChildrenDelete('billUsers', obj)),
                errorCallback('bill users'),
            )))
    }
}

export const doBillCategorySet = (category, data) => {
    return { type: 'bill/SET_BILL_CATEGORY', category, data }
}

export const doBillChildrenUpdate = (category, obj) => {
    return { type: 'bill/UPDATE_BILL_CHILDREN', category, obj, }
}

export const doBillChildrenDelete = (category, obj) => {
    return { type: 'bill/DELETE_BILL_CHILDREN', category, obj }
}

export const doBillOrderResponded = millis => {
    return { type: 'firestore/RESPONDED_TO_ORDER', millis }
}

export const doBillEnd = () => {
    return async function (dispatch, getState) {
        dispatch(doListenerChildrenUnsubscribe('bill'))
        dispatch(doListenerChildrenUnsubscribe('restaurant'))
        dispatch(doBillRemove())
        dispatch(doAppStripeProviderClear())
        dispatch(doTrackersClear())
    }
}

export const doBillRemove = () => {
    return { type: 'bill/REMOVE_BILL' }
}
