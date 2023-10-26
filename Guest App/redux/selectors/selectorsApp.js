import { createSelector } from 'reselect'


const emptyObject = {}
const emptyArray = []

export const selectIsStripeTestMode = state => !!state.app.test_mode
export const selectIsEULANeeded = state => state.user?.user?.torte?.eula?.is_needed
export const selectIsEULARepeated = state => !!state.user?.user?.torte?.eula?.dates?.length
export const selectConnectID = state => state.app.connect_id