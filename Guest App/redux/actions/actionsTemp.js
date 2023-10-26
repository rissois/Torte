export const doTempCopyRestaurant = () => {
    return async function (dispatch, getState) {
        const restaurant_id = getState().trackers.restaurant_id
        return dispatch(doTempSetRestaurant(getState().restaurants[restaurant_id]?.restaurant))
    }
}

export const doTempSetRestaurant = (restaurant = null, table = null) => {
    return { type: 'temp/SET_RESTAURANT', restaurant, table }
}

export const doTempRemoveRestaurant = () => {
    return { type: 'temp/REMOVE_RESTAURANT', }
}

export const doTempSetTable = (table, bill = null) => {
    return { type: 'temp/SET_TABLE', table, bill }
}

export const doTempRemoveTable = () => {
    return { type: 'temp/REMOVE_TABLE', }
}

export const doTempSetBill = (bill) => {
    return { type: 'temp/SET_BILL', bill }
}

export const doTempRemoveBill = () => {
    return { type: 'temp/REMOVE_BILL', }
}