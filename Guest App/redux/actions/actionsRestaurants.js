// Heavily redundanct with actionsRestaurant.js

import firestore from '@react-native-firebase/firestore'
import { Platform } from "react-native"
import { handleQuery, handleSnapshot } from "../functions/actionHelpers"
import { doAlertAdd } from "./actionsAlerts"
// import { doErrorThrown } from "./actionsAlerts"
import { doListenerStarted, doListenerChildrenUnsubscribe } from "./actionsListeners"
import { doPhotoDownload } from "./actionsRestaurantPhotos"
import { doTrackersSet } from "./actionsTrackers"

const doRestaurantUpdate = (restaurant_id, data) => {
    return async function (dispatch, getState) {
        // {...data, last_set: Date.now()}
        dispatch(doRestaurantChildrenUpdate(restaurant_id, 'restaurant', data))
        if (data?.logo?.name) {
            dispatch(doPhotoDownload(restaurant_id, data.logo.name, data.logo.date_modified))
        }
    }
}

const isVisible = ['is_visible', '==', true]

export const doRestaurantStart = (restaurant_id, isPayOnly) => {
    return async function (dispatch, getState) {
        const restaurantRef = firestore().collection('Restaurants').doc(restaurant_id)
        const errorCallback = category => error => {
            console.log('actionsUser error: ', category, error)
            dispatch(doAlertAdd('Error retrieving ' + category, 'Please exit and try again'))
        }

        dispatch(doTrackersSet({ restaurant_id }))

        dispatch(doListenerStarted('restaurant', 'restaurant',
            handleSnapshot(
                restaurantRef,
                data => dispatch(doRestaurantUpdate(restaurant_id, data)),
                data => dispatch(doRestaurantUpdate(restaurant_id, data)),
                errorCallback('restaurant'),
                errorCallback('restaurant')
            )))

        if (isPayOnly) return // No need for the rest

        dispatch(doListenerStarted('restaurant', 'menus',
            handleQuery(
                restaurantRef.collection('Menus'),
                [isVisible],
                (obj) => dispatch(doRestaurantChildrenUpdate(restaurant_id, 'menus', obj)),
                (obj) => dispatch(doRestaurantChildrenDelete(restaurant_id, 'menus', obj)),
                errorCallback('menus'),
            )))

        dispatch(doListenerStarted('restaurant', 'sections',
            handleQuery(
                restaurantRef.collection('Sections'),
                [isVisible],
                (obj) => dispatch(doRestaurantChildrenUpdate(restaurant_id, 'sections', obj)),
                (obj) => dispatch(doRestaurantChildrenDelete(restaurant_id, 'sections', obj)),
                errorCallback('menu sections'),
            )))

        dispatch(doListenerStarted('restaurant', 'items',
            handleQuery(
                restaurantRef.collection('Items'),
                [isVisible],
                (obj) => dispatch(doRestaurantChildrenUpdate(restaurant_id, 'items', obj)),
                (obj) => dispatch(doRestaurantChildrenDelete(restaurant_id, 'items', obj)),
                errorCallback('menu items'),
            )))

        dispatch(doListenerStarted('restaurant', 'panels',
            handleQuery(
                restaurantRef.collection('Panels'),
                [isVisible],
                (obj) => dispatch(doRestaurantChildrenUpdate(restaurant_id, 'panels', obj)),
                (obj) => dispatch(doRestaurantChildrenDelete(restaurant_id, 'panels', obj)),
                errorCallback('menu photo displays'),
            )))

        dispatch(doListenerStarted('restaurant', 'modifiers',
            handleQuery(
                restaurantRef.collection('Modifiers'),
                [isVisible],
                (obj) => dispatch(doRestaurantChildrenUpdate(restaurant_id, 'modifiers', obj)),
                (obj) => dispatch(doRestaurantChildrenDelete(restaurant_id, 'modifiers', obj)),
                errorCallback('item specs'),
            )))

        dispatch(doListenerStarted('restaurant', 'options',
            handleQuery(
                restaurantRef.collection('Options'),
                [isVisible],
                (obj) => dispatch(doRestaurantChildrenUpdate(restaurant_id, 'options', obj)),
                (obj) => dispatch(doRestaurantChildrenDelete(restaurant_id, 'options', obj)),
                errorCallback('options'),
            )))

        dispatch(doListenerStarted('restaurant', 'soldOut',
            handleQuery(
                restaurantRef.collection('SoldOut'),
                undefined,
                (obj) => dispatch(doRestaurantChildrenUpdate(restaurant_id, 'soldOut', obj)),
                (obj) => dispatch(doRestaurantChildrenDelete(restaurant_id, 'soldOut', obj)),
                errorCallback('menu inventory'),
            )))
    }
}


export const doRestaurantChildrenUpdate = (restaurant_id, category, obj) => {
    return { type: 'restaurant/UPDATE_RESTAURANT_CHILDREN', restaurant_id, category, obj }
}

export const doRestaurantChildrenDelete = (restaurant_id, category, obj) => {
    return { type: 'restaurant/DELETE_RESTAURANT_CHILDREN', restaurant_id, category, obj }
}

export const doRestaurantEnd = (restaurant_id,) => {
    return async function (dispatch, getState) {
        dispatch(doListenerChildrenUnsubscribe('restaurant'))
        dispatch(doRestaurantRemove(restaurant_id,))
    }
}

export const doRestaurantRemove = (restaurant_id,) => {
    return { type: 'restaurant/REMOVE_RESTAURANT', restaurant_id, }
}
