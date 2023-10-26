export const SET_ORDER = 'SET_ORDER'
export const DELETE_ORDER = 'DELETE_ORDER'
export const SET_ORDER_WRITING = 'SET_ORDER_WRITING'
export const SET_ORDER_CHECKS = 'SET_ORDER_CHECKS'

export function setOrder(order_id, data) {
    return { type: SET_ORDER, order_id, data }
}

export function deleteOrder(order_id) {
    return { type: DELETE_ORDER, order_id }
}

export function toggleOrderCheck(order_id, position = -1) {
    return async function (dispatch, getState) {
        let checks = [...getState().orders[order_id]?.checks]
        if (!~position) {
            let isFullyChecked = checks.every(check => check)
            // console.log('isFullyChecked: ', isFullyChecked)
            checks.fill(!isFullyChecked)
        }
        else {
            checks[position] = !checks[position]
        }
        dispatch(setOrderChecks(order_id, checks))
    }
}

export function setOrderChecks(order_id, checks) {
    return { type: SET_ORDER_CHECKS, order_id, checks }
}

export function setOrderWriting(order_id, write_status) {
    // console.log('setOrerWriting: ', order_id, write_status)
    return { type: SET_ORDER_WRITING, order_id, write_status }
}

