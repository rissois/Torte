import capitalize from "./capitalize"

export const firstAndL = (name) => {
  if (!name) return 'Missing name'
  const names = name.split(' ')
  if (!names[1]?.[0]) return capitalize(names[0])
  return capitalize(names[0]) + ' ' + names[1][0].toUpperCase()
}

export const firstName = (name) => {
  if (!name) return 'Missing name'
  const names = name.split(' ')
  return capitalize(names[0])
}