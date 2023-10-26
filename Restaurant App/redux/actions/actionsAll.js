// Heavily redundanct with actionsBill.js

import firebase from "firebase"
import { handleQuery, handleSnapshot } from "../functions/actionHelpers"
import { doAlertAdd } from "./actionsAlerts"
import { doAppIsAdmin, doAppReset, doAppStripeProviderSet } from "./actionsApp"
import { doListenerStarted, } from "./actionsListeners"
import { doPhotosDownload } from "./actionsPhotos"
import { doTimersDelete, doTimersInitialize, } from "./actionsTimers"
import { doChargeDelete, doChargeInitialize } from "./actionsCharges"

const DATABASE_OFFLINE = {
    state: 'offline',
    last_changed: firebase.database.ServerValue.TIMESTAMP,
};
const DATABASE_ONLINE = {
    state: 'online',
    last_changed: firebase.database.ServerValue.TIMESTAMP,
};
const FIRESTORE_OFFLINE = {
    status: {
        state: 'offline',
        last_changed: firebase.firestore.FieldValue.serverTimestamp(),
    }
};
const FIRESTORE_ONLINE = {
    status: {
        state: 'online',
        last_changed: firebase.firestore.FieldValue.serverTimestamp(),
    }
};

const doRestaurantInitialize = (doc) => {
    if (!doc?.id) return
    return async function (dispatch, getState) {
        const isTest = doc.is_hidden || !doc.is_live
        const connect_id = doc.stripe?.[isTest ? 'test' : 'live']?.connect_id

        dispatch(doAppStripeProviderSet(connect_id))
        dispatch(doCategoryUpdate('restaurant', doc))

        try {
            const idTokenResult = await firebase.auth().currentUser.getIdTokenResult()
            dispatch(doAppIsAdmin(!!idTokenResult.claims?.is_admin))
        }
        catch (error) {
            console.log('RootStackScreen updateIsAdmin error: ', error)
            dispatch(doAppIsAdmin(false))
        }
    }
}

const doRestaurantUpdate = (doc) => {
    if (!doc.id) return
    return async function (dispatch, getState) {
        const isTest = doc.is_hidden || !doc.is_live
        const connect_id = doc.stripe?.[isTest ? 'test' : 'live']?.connect_id

        const formerTest = getState().restaurant.is_hidden || !getState().restaurant.is_live
        const formerConnectID = getState().restaurant?.stripe?.[formerTest ? 'test' : 'live']?.connect_id

        if (connect_id && connect_id !== formerConnectID) {
            dispatch(doAppStripeProviderSet(connect_id))
        }
        dispatch(doCategoryUpdate('restaurant', doc))

        const restaurant_id = doc.id

        if (doc.status.state === 'offline') {
            const restaurantStatusDatabaseRef = firebase.database().ref('/Restaurants/Status/' + restaurant_id)
            restaurantStatusDatabaseRef.set(DATABASE_ONLINE);

            const restaurantStatusFirestoreRef = firebase.firestore().collection('Restaurants').doc(restaurant_id)
            restaurantStatusFirestoreRef.update(FIRESTORE_ONLINE);
        }
    }
}

const manageRestaurantPresence = (restaurant_id) => {
    /*
    ADMIN CONTROLS: Currently admin DOES NOT maintain presence for businesses
    In the future, consider full allowance OR PREFERABLY a toggle

    MULTIPLE DEVICES: This function sets the POS to disconnected even if multiple devices are active
    The Firestore listener will correct this behavior
    */

    if (!restaurant_id || restaurant_id !== firebase.auth().currentUser.uid) return

    const restaurantStatusDatabaseRef = firebase.database().ref('/Restaurants/Status/' + restaurant_id)
    const restaurantStatusFirestoreRef = firebase.firestore().collection('Restaurants').doc(restaurant_id)

    firebase.database().ref('.info/connected').on('value', function (snapshot) {
        if (snapshot.val() == false) {
            restaurantStatusFirestoreRef.update(FIRESTORE_OFFLINE);
            return;
        };

        restaurantStatusDatabaseRef.onDisconnect().set(DATABASE_OFFLINE).then(function () {
            restaurantStatusDatabaseRef.set(DATABASE_ONLINE);
            restaurantStatusFirestoreRef.update(FIRESTORE_ONLINE);
        });
    });
}

export const doAllStart = (restaurant_id) => {
    return async function (dispatch, getState) {
        const restaurantRef = firebase.firestore().collection('Restaurants').doc(restaurant_id)
        const errorCallback = category => error => {
            console.log('actionsAll error: ', category, error.message)
            dispatch(doAlertAdd('Error retrieving ' + category, 'Please exit and try again'))
        }

        manageRestaurantPresence(restaurant_id)

        dispatch(doListenerStarted('restaurant',
            handleSnapshot(
                restaurantRef,
                (data) => dispatch(doRestaurantInitialize(data)),
                (data) => dispatch(doRestaurantUpdate(data)),
                errorCallback('restaurant'),
                () => {
                    firebase.auth().signOut()
                    dispatch(doAppReset())
                }
            )
        ))

        dispatch(doListenerStarted('privates',
            handleQuery(
                restaurantRef.collection('Private'),
                undefined,
                (obj) => dispatch(doCategorySet('privates', obj)),
                (obj) => dispatch(doCategoryDelete('privates', obj)),
                errorCallback('private documents'),
            )
        ))

        dispatch(doListenerStarted('employees',
            handleQuery(
                restaurantRef.collection('Employees'),
                undefined,
                (obj) => dispatch(doCategorySet('employees', obj)),
                (obj) => dispatch(doCategoryDelete('employees', obj)),
                errorCallback('employees'),
            )
        ))

        dispatch(doListenerStarted('items',
            handleQuery(
                restaurantRef.collection('Items'),
                undefined,
                (obj) => {
                    dispatch(doCategorySet('items', obj))
                    dispatch(doPhotosDownload(Object.keys(obj).filter(item_id => obj[item_id].photo?.id).map(item_id => obj[item_id].photo), restaurant_id))
                },
                (obj) => dispatch(doCategoryDelete('items', obj)),
                errorCallback('items'),
            )
        ))

        dispatch(doListenerStarted('menus',
            handleQuery(
                restaurantRef.collection('Menus'),
                undefined,
                (obj) => dispatch(doCategorySet('menus', obj)),
                (obj) => dispatch(doCategoryDelete('menus', obj)),
                errorCallback('menus'),
            )
        ))

        dispatch(doListenerStarted('modifiers',
            handleQuery(
                restaurantRef.collection('Modifiers'),
                undefined,
                (obj) => dispatch(doCategorySet('modifiers', obj)),
                (obj) => dispatch(doCategoryDelete('modifiers', obj)),
                errorCallback('modifiers'),
            )
        ))

        dispatch(doListenerStarted('options',
            handleQuery(
                restaurantRef.collection('Options'),
                undefined,
                (obj) => dispatch(doCategorySet('options', obj)),
                (obj) => dispatch(doCategoryDelete('options', obj)),
                errorCallback('options'),
            )
        ))

        dispatch(doListenerStarted('panels',
            handleQuery(
                restaurantRef.collection('Panels'),
                undefined,
                (obj) => dispatch(doCategorySet('panels', obj)),
                (obj) => dispatch(doCategoryDelete('panels', obj)),
                errorCallback('photo panels'),

            )
        ))

        dispatch(doListenerStarted('sections',
            handleQuery(
                restaurantRef.collection('Sections'),
                undefined,
                (obj) => dispatch(doCategorySet('sections', obj)),
                (obj) => dispatch(doCategoryDelete('sections', obj)),
                errorCallback('sections'),
            )
        ))

        dispatch(doListenerStarted('tables',
            handleQuery(
                restaurantRef.collection('Tables'),
                undefined,
                (obj) => dispatch(doCategorySet('tables', obj)),
                (obj) => dispatch(doCategoryDelete('tables', obj)),
                errorCallback('tables'),
            )
        ))

        dispatch(doListenerStarted('bills',
            handleQuery(
                restaurantRef.collection('Bills'),
                [['timestamps.closed', '==', null]],
                (obj) => {
                    dispatch(doCategorySet('bills', obj))
                    dispatch(doChargeInitialize(obj))
                },
                (obj) => {
                    dispatch(doCategoryDelete('bills', obj))
                    dispatch(doChargeDelete(Object.keys(obj)))
                },
                errorCallback('bills'),
            )
        ))

        dispatch(doListenerStarted('billItems',
            handleQuery(
                firebase.firestore().collectionGroup('BillItems'),
                [['restaurant_id', '==', restaurant_id], ['timestamps.closed', '==', null]],
                (obj) => dispatch(doCategorySet('billItems', obj)),
                (obj) => dispatch(doCategoryDelete('billItems', obj)),
                errorCallback('bill items'),
            )
        ))

        dispatch(doListenerStarted('billOrders',
            handleQuery(
                firebase.firestore().collectionGroup('BillOrders'),
                [['restaurant_id', '==', restaurant_id], ['timestamps.completed', '==', null]],
                (obj) => {
                    dispatch(doCategorySet('billOrders', obj))
                    dispatch(doTimersInitialize(obj))
                },
                (obj) => {
                    dispatch(doCategoryDelete('billOrders', obj))
                    dispatch(doTimersDelete(Object.keys(obj)))
                },
                errorCallback('orders'),
            )
        ))
    }
}

export const doCategorySet = (category, obj) => {
    return { type: `${category}/SET_${category.toUpperCase()}`, obj }
}

export const doCategoryDelete = (category, obj) => {
    return { type: `${category}/DELETE_${category.toUpperCase()}`, obj }
}

export const doCategoryUpdate = (category, data) => {
    return { type: `${category}/UPDATE_${category.toUpperCase()}`, data }
}


