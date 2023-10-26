export const SET_ITEM = 'SET_ITEM'
export const DELETE_ITEM = 'DELETE_ITEM'
export const SET_SOLD_OUT_ITEMS = 'SET_SOLD_OUT_ITEMS'

export function setItem(item_id, data) {
    return async function (dispatch, getState) {
        dispatch(addItem(item_id, data))

        let index = getState().soldOutItems.indexOf(item_id)
        if (data.sold_out && !~index) {
            let temp = [...getState().soldOutItems]
            temp.push(item_id)
            dispatch(setSoldOutItems(temp))
        }
        else if (!data.sold_out && ~index) {
            let temp = [...getState().soldOutItems]
            temp.splice(index, 1)
            dispatch(setSoldOutItems(temp))
        }
    }
}

export function deleteItem(item_id) {
    return async function (dispatch, getState) {

        let index = getState().soldOutItems.indexOf(item_id)
        if (~index) {
            let temp = [...getState().soldOutItems]
            temp.splice(index, 1)
            dispatch(setSoldOutItems(temp))
        }
        dispatch(deleteItem2(item_id))
    }
}

export function deleteItem2(item_id) {
    // console.log('delete item: ', item_id)
    return { type: DELETE_ITEM, item_id }
}

function addItem(item_id, data) {
    // console.log('set item: ', item_id)
    return { type: SET_ITEM, item_id, data }
}

function setSoldOutItems(item_ids) {
    return { type: SET_SOLD_OUT_ITEMS, item_ids }
}