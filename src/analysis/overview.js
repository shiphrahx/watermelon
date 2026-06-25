// Overview-tab analytics: per-day focus rate (sparkline), day-quality labels,
// and end-of-day overrun. Pure functions over a report's `days`.

import { BLOCK_MINUTES, parseTimeToMinutes } from '../utils/time.js'
import { isWeekday } from '../utils/ranges.js'
import { weekdayName } from './insights.js'

function minutesIn(blocks, category) {
  return blocks.filter((b) => b.category === category).length * BLOCK_MINUTES
}

// Longest consecutive run (minutes) of a category within a day's blocks.
function longestRun(blocks, category) {
  let best = 0
  let run = 0
  for (const b of blocks) {
    if (b.category === category) {
      run += BLOCK_MINUTES
      if (run > best) best = run
    } else {
      run = 0
    }
  }
  return best
}

// One character label per day based on its dominant pattern (or null).
export function dayQualityLabel(day, workingStart, workingEnd) {
  const perDay = parseTimeToMinutes(workingEnd) - parseTimeToMinutes(workingStart)
  const blocks = day.blocks || []
  if (blocks.length === 0 || (!day.events?.length && !day.messages?.length)) return null

  const focus = minutesIn(blocks, 'focus')
  const meeting = minutesIn(blocks, 'meeting')
  const messaging = minutesIn(blocks, 'comms')
  const adhoc = minutesIn(blocks, 'possible-adhoc')
  const total = blocks.length * BLOCK_MINUTES || 1

  if (focus > 240 && meeting < 120) return 'Protected day'
  if (perDay > 0 && meeting > perDay * 0.5) return 'Meeting day'
  if (messaging > 180 && longestRun(blocks, 'focus') < 30) return 'Reactive day'

  const maxShare = Math.max(focus, meeting, messaging, adhoc) / total
  if (maxShare < 0.4) return 'Scattered day'

  // A working day with data that matches no specific pattern still gets a label.
  return 'Mixed day'
}

// Last activity (message or meeting end) minute-of-day for a day.
function lastActivityMinute(day) {
  let last = -1
  for (const m of day.messages || []) {
    const d = new Date(m.timestamp)
    last = Math.max(last, d.getHours() * 60 + d.getMinutes())
  }
  for (const e of day.events || []) {
    const d = e.end
    last = Math.max(last, d.getHours() * 60 + d.getMinutes())
  }
  return last
}

// How many weekdays had activity past the working-day end, with per-day overrun.
export function endOfDayOverrun(days, workingEnd, displayCapMinutes = 60) {
  const endMin = parseTimeToMinutes(workingEnd)
  const weekdays = days.filter((d) => isWeekday(d.dateKey))

  const perDay = weekdays.map((d) => {
    const last = lastActivityMinute(d)
    const overrun = last > endMin ? last - endMin : 0
    return {
      dateKey: d.dateKey,
      weekday: weekdayName(d.dateKey),
      overrunMinutes: overrun,
      displayMinutes: Math.min(overrun, displayCapMinutes),
    }
  })

  const daysOver = perDay.filter((d) => d.overrunMinutes > 0).length
  return { perDay, daysOver, totalDays: weekdays.length }
}
