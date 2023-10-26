export default function equalArrays(a, b, ordered) {

  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    (
      ordered
        ? a.every((val, index) => val === b[index])
        : a.every(val => b.includes(val))
    )

}