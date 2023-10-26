export default function singularize(str,) { // consider extra argument for es (true, num)
  if (!str) {
    return str
  }
  return str.substring(0, str.length - 1)
}