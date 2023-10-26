import { collection, doc, getFirestore } from 'firebase/firestore'
import { handleQuery, handleSnapshot } from "../functions/actionHelpers"
import { initialMenuTrackers } from "../reducers/reducerTrackers"
import { doAlertAdd } from "./actionsAlerts"
import { doListenerStarted, doListenerChildrenUnsubscribe } from "./actionsListeners"
import { doTrackersClear, doTrackersSet } from "./actionsTrackers"
import { navigationReset } from '../../navigators/functions/AppNavigation'

import firebaseApp from '../../firebase/firebase'

const firestore = getFirestore(firebaseApp)


export const doReceiptStart = (receipt_id, isReceiptNewToUser) => {
    return async function (dispatch, getState) {
        const receiptRef = doc(firestore, 'Receipts', receipt_id)
        const errorCallback = category => error => {
            console.log('doReceiptStart error: ', category, error.message)
            dispatch(doAlertAdd('Error retrieving ' + category, 'Please exit and try again'))
        }

        dispatch(doTrackersSet({ receipt_id, ...initialMenuTrackers }))

        dispatch(doListenerStarted('receipt', 'receipt',
            handleSnapshot(
                receiptRef,
                data => {
                    dispatch(doReceiptChildrenUpdate('receipt', data))

                    console.log(`is not approved: ${!data.is_approved}`)

                    if (!data.is_approved) {
                        console.log('GO TO EDIT')
                        // Go to EDIT
                        navigationReset([
                            { name: 'Home' },
                            { name: 'ReceiptTab', screen: 'Edit' },
                        ])
                    }
                    else if (isReceiptNewToUser) {
                        // Go to SPLIT
                        navigationReset([
                            { name: 'Home' },
                            { name: 'ReceiptTab', params: { screen: 'Divide' } },
                        ])
                    }
                    else {
                        console.log('GO TO RECEIPT')

                        // Go to SUMMARY
                        navigationReset([
                            { name: 'Home' },
                            { name: 'ReceiptTab', params: { screen: 'Receipts' } },
                        ])
                    }
                },
                data => dispatch(doReceiptChildrenUpdate('receipt', data)),
                errorCallback('this receipt'),
                () => {
                    dispatch(doAlertAdd('Could not load receipt'))
                    dispatch(doReceiptEnd())
                }
            )))



        dispatch(doListenerStarted('receipt', 'receiptItems',
            handleQuery(
                collection(receiptRef, 'ReceiptItems'),
                undefined,
                obj => dispatch(doReceiptChildrenUpdate('receiptItems', obj)),
                obj => dispatch(doReceiptChildrenDelete('receiptItems', obj)),
                errorCallback('receipt items'),
            )))

        dispatch(doListenerStarted('receipt', 'receiptUsers',
            handleQuery(
                collection(receiptRef, 'ReceiptUsers'),
                undefined,
                obj => dispatch(doReceiptChildrenUpdate('receiptUsers', obj)),
                obj => dispatch(doReceiptChildrenDelete('receiptUsers', obj)),
                errorCallback('receipt users'),
            )))
    }
}

export const doReceiptCategorySet = (category, data) => {
    return { type: 'receipt/SET_RECEIPT_CATEGORY', category, data }
}

export const doReceiptChildrenUpdate = (category, obj) => {
    return { type: 'receipt/UPDATE_RECEIPT_CHILDREN', category, obj, }
}

export const doReceiptChildrenDelete = (category, obj) => {
    return { type: 'receipt/DELETE_RECEIPT_CHILDREN', category, obj }
}

export const doReceiptEnd = () => {
    return async function (dispatch, getState) {
        dispatch(doListenerChildrenUnsubscribe('receipt'))
        dispatch(doReceiptRemove())
        dispatch(doTrackersClear())
    }
}

export const doReceiptRemove = () => {
    return { type: 'receipt/REMOVE_RECEIPT' }
}

export const doReceiptIsEditing = isEditing => {
    return { type: 'receipt/IS_EDITING', isEditing }
}
export const doReceiptSetURI = uri => {
    return { type: 'receipt/SET_URI', uri }
}
