export default function centsToDollar(cents) {
  if (isNaN(cents)) return '$0.00'
  return (cents < 0 ? '-$' : '$') + (Math.abs(cents) / 100).toFixed(2);
}