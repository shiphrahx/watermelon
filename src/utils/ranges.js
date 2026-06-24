// Date-range helpers for the dashboard: week presets, week navigation, and the
// "previous equivalent period" used for trend comparisons.
//
// Ranges are plain { startKey, endKey } objects of "YYYY-MM-DD" date keys.

import { toDateKey, fromDateKey } from './time.js'

export const MAX_CUSTOM_RANGE_DAYS = 31

export function isWeekend(dateOrKey) {
  const d = typeof dateOrKey === 'string' ? fromDateKey(dateOrKey) : dateOrKey
  const day = d.getDay()
  return day === 0 || day === 6
}

export function isWeekday(dateOrKey) {
  return !isWeekend(dateOrKey)
}

// Monday of the week containing `date` (weeks start Monday).
export function mondayOf(date) {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = d.getDay() // 0 Sun .. 6 Sat
  const diff = day === 0 ? -6 : 1 - day // shift back to Monday
  d.setDate(d.getDate() + diff)
  return d
}

function addDays(date, n) {
  const d = new Date(date.getTime())
  d.setDate(d.getDate() + n)
  return d
}

// This week: Monday -> today, or Monday -> Friday if today is a weekend.
export function thisWeekRange(today = new Date()) {
  const monday = mondayOf(today)
  const end = isWeekend(today) ? addDays(monday, 4) : today
  return { startKey: toDateKey(monday), endKey: toDateKey(end) }
}

// Last week: the previous Monday -> Friday (full working week).
export function lastWeekRange(today = new Date()) {
  const monday = addDays(mondayOf(today), -7)
  return { startKey: toDateKey(monday), endKey: toDateKey(addDays(monday, 4)) }
}

// Last 2 weeks: Monday of last week -> today (last full week + this week so far).
export function lastTwoWeeksRange(today = new Date()) {
  const monday = addDays(mondayOf(today), -7)
  const end = isWeekend(today) ? addDays(mondayOf(today), 4) : today
  return { startKey: toDateKey(monday), endKey: toDateKey(end) }
}

// Inclusive number of calendar days in a range.
export function rangeDayCount({ startKey, endKey }) {
  const start = fromDateKey(startKey)
  const end = fromDateKey(endKey)
  return Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1
}

// Number of weekdays (Mon-Fri) in a range, inclusive.
export function weekdayCount({ startKey, endKey }) {
  let count = 0
  let cur = fromDateKey(startKey)
  const end = fromDateKey(endKey)
  while (cur <= end) {
    if (isWeekday(cur)) count++
    cur = addDays(cur, 1)
  }
  return count
}

// Shift a range backwards/forwards by a whole number of days.
export function shiftRangeDays({ startKey, endKey }, days) {
  return {
    startKey: toDateKey(addDays(fromDateKey(startKey), days)),
    endKey: toDateKey(addDays(fromDateKey(endKey), days)),
  }
}

// The "previous week" comparison period: the same span shifted back 7 days.
export function previousWeekRange(range) {
  return shiftRangeDays(range, -7)
}

// Week navigation: move the whole range one week earlier/later.
export function navigateWeek(range, direction) {
  return shiftRangeDays(range, direction * 7)
}

// Day navigation for the day view.
export function navigateDay(dateKey, direction) {
  return toDateKey(addDays(fromDateKey(dateKey), direction))
}

// Named presets the dashboard exposes.
export const RANGE_PRESETS = [
  { id: 'this-week', label: 'This week', range: (t) => thisWeekRange(t) },
  { id: 'last-week', label: 'Last week', range: (t) => lastWeekRange(t) },
  { id: 'last-2-weeks', label: 'Last 2 weeks', range: (t) => lastTwoWeeksRange(t) },
  { id: 'custom', label: 'Custom range', range: null },
]

// Clamp a custom range to the maximum allowed span (keeps start, moves end in).
export function clampCustomRange({ startKey, endKey }) {
  let s = fromDateKey(startKey)
  let e = fromDateKey(endKey)
  if (e < s) [s, e] = [e, s]
  const maxEnd = addDays(s, MAX_CUSTOM_RANGE_DAYS - 1)
  if (e > maxEnd) e = maxEnd
  return { startKey: toDateKey(s), endKey: toDateKey(e) }
}
