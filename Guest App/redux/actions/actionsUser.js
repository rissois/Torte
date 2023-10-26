import firestore from '@react-native-firebase/firestore'
import auth from '@react-native-firebase/auth'
import { handleQuery, handleSnapshot } from '../functions/actionHelpers'
import { doAlertAdd } from './actionsAlerts'
import { doAppReset } from './actionsApp'
import { doListenerStarted, doListenerChildrenUnsubscribe } from "./actionsListeners"

export const doUserStart = () => {
    return async function (dispatch, getState) {
        const myID = auth().currentUser.uid

        const userRef = firestore().collection('UsersPOS').doc(myID)
        const errorCallback = category => error => {
            console.log('actionsUser error: ', category, error.message)
            dispatch(doAlertAdd('Error retrieving ' + category, 'Please exit and try again'))
        }

        dispatch(doListenerStarted('user', 'user', handleSnapshot(
            userRef,
            data => dispatch(doUserChildrenUpdate('user', data)),
            data => dispatch(doUserChildrenUpdate('user', data)),
            errorCallback('your details'),
            () => {
                dispatch(doUserEnd())
                dispatch(doAppReset())
            }
        )))

        dispatch(doListenerStarted('user', 'coupons',
            handleQuery(
                userRef.collection('Coupons'),
                undefined,
                (obj) => dispatch(doUserChildrenUpdate('coupons', obj)),
                (obj) => dispatch(doUserChildrenDelete('coupons', obj)),
                errorCallback(' your discounts'),
            )
        ))

        dispatch(doListenerStarted('user', 'cards',
            handleQuery(
                userRef.collection('Cards'),
                [['is_deleted', '==', false]],
                (obj) => dispatch(doUserChildrenUpdate('cards', obj)),
                (obj) => dispatch(doUserChildrenDelete('cards', obj)),
                errorCallback(' your credit cards'),
            )
        ))

        dispatch(doListenerStarted('user', 'spend',
            handleQuery(
                userRef.collection('Spend'),
                undefined,
                (obj) => dispatch(doUserChildrenUpdate('spend', obj)),
                (obj) => dispatch(doUserChildrenDelete('spend', obj)),
                errorCallback(' your loyalty information'),
            )
        ))
    }
}

export const doUserChildrenUpdate = (category, obj) => {
    return { type: 'user/UPDATE_USER_CHILDREN', category, obj }
}

export const doUserChildrenDelete = (category, obj) => {
    return { type: 'user/DELETE_USER_CHILDREN', category, obj }
}

export const doUserEnd = () => {
    return async function (dispatch, getState) {
        dispatch(doListenerChildrenUnsubscribe('user'))
        dispatch(doListenerChildrenUnsubscribe('bill'))
        dispatch(doListenerChildrenUnsubscribe('restaurant'))
        auth().signOut()
        return null
        // return { type: 'root/USER_LOG_OUT' }
    }
}
