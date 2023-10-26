import { createSelector } from "reselect"
import { selectIsStripeTestMode } from "./selectorsApp"

const emptyObject = {}

const selectCoupons = state => state.user.coupons ?? emptyObject

export const selectCoupon = (coupon_id) => createSelector(
    selectCoupons,
    coupons => coupons[coupon_id] ?? emptyObject
)

export const selectAvailableCoupons = createSelector(
    selectCoupons,
    selectIsStripeTestMode,
    (coupons, isStripeTestMode) => {
        const today = new Date()
        // NOTE: Will need to specify restaurant or torte in future, and reflect change in payment as well
        return Object.keys(coupons)
            .filter(coupon_id => coupons[coupon_id].is_test === isStripeTestMode && !coupons[coupon_id].timestamps.used && !(coupons[coupon_id].timestamps.expiration?.toDate() < today))
            .reduce((acc, coupon_id) => [...acc, coupons[coupon_id]], [])
    }
)
