export const recursiveFieldGetter = (obj, ...fields) => {
  if (!fields.length) return obj
  if (fields.length === 1) return obj[fields[0]]
  if (!obj[fields[0]]) return undefined

  return recursiveFieldGetter(obj[fields[0]], ...fields.slice(1))
}