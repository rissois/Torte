export const formatPhoneNumber = (number) => {
  if (!number) {
    return null
  }

  number = number.toString()

  let formatted = '(' + number.substring(0, 3) + ')'
  if (number.length > 3) {
    formatted += ' ' + number.substring(3, 6)
    if (number.length > 6) {
      formatted += '-' + number.substring(6, 10)
    }
  }

  return formatted
}