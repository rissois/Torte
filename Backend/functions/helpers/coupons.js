
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

exports.calculateDiscount = (billRemaining, coupon) => {

    if (coupon.value) {
        let remainingValue = coupon.value
        remainingValue -= processValues(billRemaining, 'remainingTip', remainingValue)
        remainingValue -= processValues(billRemaining, 'remainingTax', remainingValue)
        remainingValue -= processValues(billRemaining, 'remainingSubtotal', remainingValue)
        return coupon.value - remainingValue
    }

    /*
    CHECK POST-TAX AND PRE-TAX
    */

}