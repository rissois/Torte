export default function calculateTimeRemaining(timestamp, duration) {
  if (!timestamp) return 0
  if (typeof timestamp === 'number') return timestamp + duration - Date.now()
  return timestamp.toMillis() + duration - Date.now()
}