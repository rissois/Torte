import { doc, collection, getFirestore } from 'firebase/firestore'
import { getAuth, signOut } from 'firebase/auth'
import { handleQuery, handleSnapshot } from '../functions/actionHelpers'
import { doAlertAdd } from './actionsAlerts'
import { doAppReset } from './actionsApp'
import { doListenerStarted, doListenerChildrenUnsubscribe } from "./actionsListeners"
import firebaseApp from '../../firebase/firebase'

const auth = getAuth(firebaseApp)
const firestore = getFirestore(firebaseApp)

export const doUserSetName = (name) => {
    return { type: 'user/SET_NAME', name }
}

export const doUserStart = () => {
    return async function (dispatch, getState) {
        const myID = auth.currentUser.uid

        const userRef = doc(firestore, 'UsersPOS', myID)
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
                collection(userRef, 'Coupons'),
                undefined,
                (obj) => dispatch(doUserChildrenUpdate('coupons', obj)),
                (obj) => dispatch(doUserChildrenDelete('coupons', obj)),
                errorCallback(' your discounts'),
            )
        ))

        dispatch(doListenerStarted('user', 'cards',
            handleQuery(
                collection(userRef, 'Cards'),
                [['is_deleted', '==', false]],
                (obj) => dispatch(doUserChildrenUpdate('cards', obj)),
                (obj) => dispatch(doUserChildrenDelete('cards', obj)),
                errorCallback(' your credit cards'),
            )
        ))

        dispatch(doListenerStarted('user', 'spend',
            handleQuery(
                collection(userRef, 'Spend'),
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
        signOut(auth)
        return null
        // return { type: 'root/USER_LOG_OUT' }
    }
}
