import { selectIsStripeTestMode } from "../selectors/selectorsApp"
import { selectTrackedRestaurant } from "../selectors/selectorsRestaurant2"

export const doAppStripeProviderSet = () => {
    return function (dispatch, getState) {
        const isStripeTestMode = selectIsStripeTestMode(getState())
        const restaurant = selectTrackedRestaurant(getState())
        dispatch(doAppStripeProviderSet2(restaurant?.stripe?.[isStripeTestMode ? 'test' : 'live']?.connect_id))
    }
}

export const doAppStripeProviderSet2 = (connect_id) => {
    return { type: 'app/SET_STRIPE_PROVIDER', connect_id }
}

export const doAppStripeProviderClear = () => {
    return { type: 'app/CLEAR_STRIPE_PROVIDER', }
}

export const doAppStripeTestModeSet = (test_mode = false) => {
    return { type: 'app/SET_STRIPE_TEST_MODE', test_mode }
}

export const doAppReset = () => {
    // NOTE: does not reset restaurants... no real need to?
    return { type: 'app/RESET' }
}