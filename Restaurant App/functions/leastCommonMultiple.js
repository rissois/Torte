import greatestCommonDivisor from './greatestCommonDivisor'

export default function leastCommonMultiple(x, y) {
  if ((typeof x !== 'number') || (typeof y !== 'number'))
    return false;
  return (!x || !y) ? 0 : Math.abs((x * y) / greatestCommonDivisor(x, y))
}