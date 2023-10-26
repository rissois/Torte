export default function plurarize(number, singular, plural, nounOnly) {
  if (nounOnly) {
    if (number === 1) return singular
    return plural
  }

  if (number === 1) return number + ' ' + singular
  return number + ' ' + plural
}