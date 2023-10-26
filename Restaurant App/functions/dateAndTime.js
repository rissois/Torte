import { fullDays, months } from "../constants/DOTW"

export function dateToMilitary(date) { return date.getHours().toString().padStart(2, '0') + date.getMinutes().toString().padStart(2, '0') }

export function dateToClock(date) {
  if (!date) return '00:00 AM'
  return (date.getHours() % 12 ? date.getHours() % 12 : 12) + ':' + date.getMinutes().toString().padStart(2, 0) + (date.getHours() < 12 ? ' AM' : ' PM')
}

export function dateToCalendar(date) {
  return (months?.[date.getMonth()] ?? 'UNK') + ' ' + (date.getDate())
}

export function dateToFullCalendar(date) {
  return (date.getMonth() + 1) + '/' + date.getDate() + '/' + date.getFullYear().toString().substring(2)
}

export function militaryToClock(military_time, day = '') {
  if (!military_time) return ''
  let hour = military_time.substring(0, 2) % 12
  if (hour === 0) hour = 12

  let min = military_time.substring(2)

  let meridiem = military_time.substring(0, 2) < 12 ? 'AM' : 'PM'
  return (day ? day + ' ' : '') + hour + ':' + min + ' ' + meridiem
}

export function militaryToDate(mili) {
  if (!mili) {
    return new Date()
  }
  let date = new Date()
  date.setHours(mili.substring(0, 2))
  date.setMinutes(mili.substring(2))
  return date
}

export function addHoursToMilitary(mili, hours, max = '2400') {
  let newTime = parseInt(mili) + (hours * 100)
  if (newTime > max) {
    return max
  }
  return (newTime % 2400).toString().padStart(4, 0)
}

export function YYYYMMDD(date) {
  if (!(date instanceof Date)) {
    return ''
  }
  return date.getFullYear().toString() + (date.getMonth() + 1).toString().padStart(2, 0) + (date.getDate()).toString().padStart(2, 0)
}

export const getMidnight = (dayShift = 0, start) => {
  let date = start ?? new Date()

  // Shift days forward or backwards if required
  date.setDate(date.getDate() + dayShift)

  // Convert to midnight (12AM)
  date.setHours(0, 0, 0, 0)

  // Return as date object
  return date
}

export const shiftDayIndex = (dayIndex, shift) => (Number(dayIndex) + shift) % 7
export const getDOTW = (dayIndex, shift = 0) => fullDays[shiftDayIndex(dayIndex, shift)]