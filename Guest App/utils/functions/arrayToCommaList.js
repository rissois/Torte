export default function arrayToCommaList(arr, or) {
  if (!arr) return ''
  let copy = [...arr]
  if (!copy.length) return ''
  if (copy.length === 1) return copy[0]
  const last = copy.pop();
  return copy.join(', ') + (copy.length >= 2 ? ',' : '') + (or ? ' or ' : ' and ') + last;
}