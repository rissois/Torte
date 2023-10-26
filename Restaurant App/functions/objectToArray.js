export default function objectToArray(obj) {
  return Object.keys(obj).map(function (key) {
    return { key, ...obj[key] }
  })
}