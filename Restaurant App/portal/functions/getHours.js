import { shiftDOTW } from "../../utils/functions/dateAndTime"

export const getStartOfDay = (days, dotw_id, shift = 0) => getStartOfHours(days[shiftDOTW(dotw_id, shift)].hours)
export const getEndOfDay = (days, dotw_id, shift = 0) => getEndOfHours(days[shiftDOTW(dotw_id, shift)].hours)

export const getStartOfHours = hours => hours[0]?.start
export const getEndOfHours = hours => hours[hours.length - 1]?.end

export const checkIfHoursOverlap = hours => {
  if (hours.length <= 1) return false

  const copy = [...hours].sort((a, b) => a.start - b.start)
  return copy.some((hour, index) => hour.end > copy[index + 1]?.start)
}
