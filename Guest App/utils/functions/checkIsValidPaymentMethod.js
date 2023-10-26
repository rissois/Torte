export default function checkIsValidPaymentMethod({ exp_month, exp_year }) {
  if (!exp_month || !exp_year) return false

  const today = new Date()
  const year = today.getFullYear() % 100

  return year < exp_year ||
    (
      year === exp_year &&
      // Date is 0-11, Stripe is 1-12
      today.getMonth() < exp_month
      // What if bill started 11:59PM on the 31st?
    )
}