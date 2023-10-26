import months from "../constants/months"

export function dateToMilitary(date) { return date.getHours().toString().padStart(2, '0') + date.getMinutes().toString().padStart(2, '0') }

export function dateToClock(date) {
  return (date.getHours() % 12 ? date.getHours() % 12 : 12) + ':' + date.getMinutes().toString().padStart(2, 0) + (date.getHours() < 12 ? ' AM' : ' PM')
}

export function dateToCalendar(date) {
  return (months?.[date.getMonth()] ?? 'UNK') + ' ' + (date.getDate())
}

export function militaryToClock(military_time, day = '', as_midnight) {
  if (military_time === '2400') {
    if (as_midnight) return 'midnight'
    return '12:00 AM'
  }

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

export const shiftDOTW = (dotw_id, shift) => {
  const remainder = [(Number(dotw_id) + shift)] % 7
  if (remainder < 0) {
    return remainder + 7
  }
  return remainder
}