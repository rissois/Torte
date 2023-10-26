export default function equalArrays(a, b, ordered) {

  return Array.isArray(a) &&
    Array.isArray(b) &&
    a.length === b.length &&
    (
      typeof a[0] === 'object' ?
        ordered
          // Not bothering to check each object is same length of keys, not utilized
          ? a.every((a_obj, index) => Object.keys(a_obj).every(key => a_obj[key] === b[index][key]))
          : a.every(a_obj => b.some(b_obj => Object.keys(a_obj).every(key => a_obj[key] === b_obj[key]))) :
        ordered
          ? a.every((val, index) => val === b[index])
          : a.every(val => b.includes(val))
    )

}