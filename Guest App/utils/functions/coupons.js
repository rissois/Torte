export const pertinentCouponInformation = ({ id, percent, value }) => ({ id, percent, value, })

const processValues = (billRemaining, field, remainingValue) => {
  const billValue = billRemaining[field]
  if (!remainingValue || !billValue) return 0

  // Discount exceeds available value for this field
  if (remainingValue > billValue) {
    billRemaining[field] = 0
    return billValue
  }

  billRemaining[field] -= remainingValue
  return remainingValue
}

export const calculateDiscounts = (subtotal, tax, tip, coupons) => {
  // const preTaxCoupons = coupons.filter(coupon => coupon.percent?.is_pre_tax)
  // const postTaxCoupons = coupons.filter(coupon => coupon.percent && !coupon.percent?.is_pre_tax)
  const valueCoupons = coupons.filter(coupon => coupon.value)

  let billRemaining = {
    remainingTip: tip,
    remainingTax: tax,
    remainingSubtotal: subtotal,
  }

  let appliedPerCoupon = {}

  valueCoupons.forEach(coupon => {
    let remainingValue = coupon.value
    remainingValue -= processValues(billRemaining, 'remainingTip', remainingValue)
    remainingValue -= processValues(billRemaining, 'remainingTax', remainingValue)
    remainingValue -= processValues(billRemaining, 'remainingSubtotal', remainingValue)
    appliedPerCoupon[coupon.id] = coupon.value - remainingValue
  })

  /*
  HANDLE POST-TAX AND PRE-TAX
  */

  return appliedPerCoupon
}