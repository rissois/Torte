export default function commaList(arr) {
  let copy = [...arr]
  if (!copy.length) return ''
  if (copy.length === 1) return copy[0]
  const last = copy.pop();
  return copy.join(', ') + (copy.length >= 2 ? ',' : '') + ' and ' + last;
}