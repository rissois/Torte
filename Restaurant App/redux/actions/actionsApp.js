import { doListenerChildrenUnsubscribe } from "./actionsListeners"

export const doDietaryTableFilterToggle = (filter) => {
    return { type: 'app/TOGGLE_DIETARY_TABLE_FILTER', filter }
}

export const doDietaryTableFilterClear = () => {
    return { type: 'app/CLEAR_DIETARY_TABLE', }
}

export const doAppEmployeeSet = (employee_id) => {
    return { type: 'app/SET_EMPLOYEE', employee_id }
}

export const doAppEmployeeClear = () => {
    return { type: 'app/CLEAR_EMPLOYEE', }
}

export const doAppStripeProviderSet = (connect_id) => {
    return { type: 'app/SET_STRIPE_PROVIDER', connect_id }
}

export const doAppStripeProviderClear = () => {
    return { type: 'app/CLEAR_STRIPE_PROVIDER', }
}

export const doAppStripeTestModeSet = (test_mode = false) => {
    return { type: 'app/SET_STRIPE_TEST_MODE', test_mode }
}

export const doAppIsAdmin = (is_admin) => {
    return { type: 'app/SET_IS_ADMIN', is_admin }

}

export const doAppReset = () => {
    // NOTE: does not reset restaurants... no real need to?
    return async function (dispatch, getState) {
        dispatch(doListenerChildrenUnsubscribe())
        dispatch(doAppReset2())
    }
}

export const doAppReset2 = () => {
    return { type: 'app/RESET' }
}