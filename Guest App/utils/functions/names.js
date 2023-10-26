import capitalize from "./capitalize"

export const firstAndL = (name) => {
  if (!name) return 'UNK'
  const names = name.split(' ')
  if (!names[1]?.[0]) return capitalize(names[0])
  return capitalize(names[0]) + ' ' + names[1][0].toUpperCase()
}

export const getNameOfUser = (userID, userNamesByID, isLastInitial, isPossessive,) => {
  const name = userNamesByID[userID]
  if (!name) return 'Missing name'
  const ending = isPossessive ? "'s" : ''
  if (isLastInitial) return firstAndL(name) + ending
  return name + ending

}