export const SET_EMPLOYEE = 'SET_EMPLOYEE'
export const DELETE_EMPLOYEE = 'DELETE_EMPLOYEE'
export const SET_USER = 'SET_USER'
export const CLEAR_USER = 'CLEAR_USER'

export function setEmployee(employee_id, data) {
    console.log('set employee: ', employee_id)
    return { type: SET_EMPLOYEE, employee_id, data }
}

export function deleteEmployee(employee_id) {
    return async function (dispatch, getState) {
        if (getState().user === employee_id) {
            dispatch(setUser(''))
        }
        dispatch(removeEmployee(employee_id))
    }
}

export function removeEmployee(employee_id) {
    console.log('delete employee: ', employee_id)
    return { type: DELETE_EMPLOYEE, employee_id }
}

export function setUser(employee_id) {
    return { type: SET_USER, employee_id }
}

export function clearUser() {
    return { type: CLEAR_USER }
}