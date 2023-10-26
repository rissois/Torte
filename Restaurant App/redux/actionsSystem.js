export const SET_TICKET = 'SET_TICKET'
export const SET_TABLE_ORDER = 'SET_TABLE_ORDER'
export const SET_LISTENER_TIME = 'SET_LISTENER_TIME'
export const SET_LISTENER_TIME_TIMEOUT = 'SET_LISTENER_TIME_TIMEOUT'
export const CLEAR_LISTENER_TIME = 'CLEAR_LISTENER_TIME'

// export function setTicket(bill_id) {
//     return { type: SET_TICKET, bill_id }
// }

export function setTableOrder(table_order) {
    // console.log('set table order: ', table_order)
    return ({ type: SET_TABLE_ORDER, table_order })
}

export function setListenerTime(time) {
    // console.log('setting listener time: ', time)
    return ({ type: SET_LISTENER_TIME, time })
}

export function setListenerTimeTimeout(timeout) {
    return ({ type: SET_LISTENER_TIME_TIMEOUT, timeout })
}

export function clearListenerTime() {
    // console.log('CLearing listener time')
    return async function (dispatch, getState) {
        let { default_listener_time_timeout } = getState().system
        if (default_listener_time_timeout) {
            clearTimeout(default_listener_time_timeout)
        }

        dispatch(resetListenerTime())
    }
}



export function resetListenerTime() {
    return ({ type: CLEAR_LISTENER_TIME })
}