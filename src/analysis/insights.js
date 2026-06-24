// Insight computations that turn a report (per-day classified blocks + events +
// messages) into the human-readable metrics the dashboard and day view show.
//
// All functions are pure. Time values are kept in minutes internally; the UI
// formats them with formatDuration ("Xh Ym").

import { BLOCK_MINUTES, parseTimeToMinutes, minutesToTimeLabel, formatDuration } from '../utils/time.js'
import { fromDateKey } from '../utils/time.js'
import { isWeekday } from '../utils/ranges.js'
import { CATEGORY_LABELS } from './classify.js'

const WEEKDAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export function weekdayName(dateKey) {
  return WEEKDAY_NAMES[fromDateKey(dateKey).getDay()]
}

// Minutes spent in a given category within a list of blocks.
function minutesIn(blocks, category) {
  return blocks.filter((b) => b.category === category).length * BLOCK_MINUTES
}

function dayHasData(day) {
  return (day.events?.length || 0) > 0 || (day.messages?.length || 0) > 0
}

// --- Core week insights ---------------------------------------------------

export function computeInsights({ days, workingStart, workingEnd }) {
  const workingMinutesPerDay = parseTimeToMinutes(workingEnd) - parseTimeToMinutes(workingStart)
  const weekdayDays = days.filter((d) => isWeekday(d.dateKey))

  const focusMinutes = sumCategory(weekdayDays, 'focus')
  const meetingMinutes = sumCategory(weekdayDays, 'meeting')
  const messagingMinutes = sumCategory(weekdayDays, 'comms')
  const adhocMinutes = sumCategory(weekdayDays, 'possible-adhoc')

  const totalWorkingMinutes = weekdayDays.length * workingMinutesPerDay
  const focusRate = totalWorkingMinutes > 0 ? (focusMinutes / totalWorkingMinutes) * 100 : 0

  return {
    workingStart,
    workingEnd,
    workingMinutesPerDay,
    weekdayCount: weekdayDays.length,
    focusMinutes,
    meetingMinutes,
    messagingMinutes,
    adhocMinutes,
    totalWorkingMinutes,
    focusRate,
    busiestDay: pickDay(weekdayDays, 'meeting'),
    mostFocusedDay: pickDay(weekdayDays, 'focus'),
    perDay: buildPerDay(days),
    focusWindows: computeFocusWindows(weekdayDays, workingStart, workingEnd),
    focusByDay: buildFocusByDay(weekdayDays),
    topConsumers: computeTopConsumers(weekdayDays),
  }
}

function sumCategory(days, category) {
  return days.reduce((acc, d) => acc + minutesIn(d.blocks, category), 0)
}

// The day with the most minutes of `category`. Ties break to the earliest day.
function pickDay(days, category) {
  let best = null
  for (const d of days) {
    const minutes = minutesIn(d.blocks, category)
    if (minutes <= 0) continue
    if (!best || minutes > best.minutes) {
      best = { dateKey: d.dateKey, weekday: weekdayName(d.dateKey), minutes }
    }
  }
  return best
}

// Per-day breakdown for the stacked-bar panel — every day in range, with a flag
// so the UI can grey out weekends / no-data days.
function buildPerDay(days) {
  return days.map((d) => ({
    dateKey: d.dateKey,
    weekday: weekdayName(d.dateKey),
    isWeekday: isWeekday(d.dateKey),
    hasData: dayHasData(d),
    categories: {
      focus: minutesIn(d.blocks, 'focus'),
      meeting: minutesIn(d.blocks, 'meeting'),
      comms: minutesIn(d.blocks, 'comms'),
      'possible-adhoc': minutesIn(d.blocks, 'possible-adhoc'),
    },
    total: d.blocks.length * BLOCK_MINUTES,
  }))
}

// Average focus minutes per 1-hour slot across the weekdays in range.
function computeFocusWindows(weekdayDays, workingStart, workingEnd) {
  const startMin = parseTimeToMinutes(workingStart)
  const endMin = parseTimeToMinutes(workingEnd)
  const denom = weekdayDays.length || 1

  const slots = []
  for (let m = startMin; m + 60 <= endMin; m += 60) {
    let total = 0
    for (const d of weekdayDays) {
      for (const b of d.blocks) {
        if (b.category === 'focus' && b.startMinute >= m && b.startMinute < m + 60) {
          total += BLOCK_MINUTES
        }
      }
    }
    slots.push({
      startMinute: m,
      endMinute: m + 60,
      label: `${minutesToTimeLabel(m)}–${minutesToTimeLabel(m + 60)}`,
      avgFocusMinutes: total / denom,
    })
  }

  let top = null
  for (const s of slots) {
    if (s.avgFocusMinutes > 0 && (!top || s.avgFocusMinutes > top.avgFocusMinutes)) top = s
  }
  return { slots, top }
}

// Total focus minutes per day (for the "focus by day" bar chart).
function buildFocusByDay(weekdayDays) {
  const bars = weekdayDays.map((d) => ({
    dateKey: d.dateKey,
    weekday: weekdayName(d.dateKey),
    focusMinutes: minutesIn(d.blocks, 'focus'),
  }))
  let best = null
  for (const b of bars) {
    if (b.focusMinutes > 0 && (!best || b.focusMinutes > best.focusMinutes)) best = b
  }
  return { bars, best }
}

// Top 5 calendar event titles by total duration across the period.
function computeTopConsumers(weekdayDays) {
  const byTitle = new Map()
  for (const d of weekdayDays) {
    for (const e of d.events || []) {
      const minutes = Math.max(0, Math.round((e.end.getTime() - e.start.getTime()) / 60000))
      if (minutes <= 0) continue
      const prev = byTitle.get(e.subject) || 0
      byTitle.set(e.subject, prev + minutes)
    }
  }
  return [...byTitle.entries()]
    .map(([subject, minutes]) => ({ subject, minutes }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, 5)
}

// --- Trend comparison -----------------------------------------------------

// Compare a current value to a previous one. Returns direction + percent change.
export function trend(current, previous) {
  if (previous === 0 && current === 0) return { direction: 'flat', deltaPct: 0 }
  if (previous === 0) return { direction: 'up', deltaPct: null } // no baseline
  const deltaPct = ((current - previous) / previous) * 100
  const direction = deltaPct > 1 ? 'up' : deltaPct < -1 ? 'down' : 'flat'
  return { direction, deltaPct }
}

export function computeTrends(current, previous) {
  return {
    focusMinutes: trend(current.focusMinutes, previous.focusMinutes),
    meetingMinutes: trend(current.meetingMinutes, previous.meetingMinutes),
    focusRate: trend(current.focusRate, previous.focusRate),
  }
}

// --- Day-scoped insights --------------------------------------------------

// Longest consecutive run of focus blocks in a day.
function longestFocusBlock(blocks) {
  let best = null
  let runMinutes = 0
  let runStart = null
  for (const b of blocks) {
    if (b.category === 'focus') {
      if (runStart === null) runStart = b.startMinute
      runMinutes += BLOCK_MINUTES
      if (!best || runMinutes > best.minutes) {
        best = { minutes: runMinutes, startMinute: runStart }
      }
    } else {
      runMinutes = 0
      runStart = null
    }
  }
  return best
}

export function computeDayInsight(day, workingStart, workingEnd) {
  const workingMinutesPerDay = parseTimeToMinutes(workingEnd) - parseTimeToMinutes(workingStart)
  const blocks = day?.blocks || []

  const focusMinutes = minutesIn(blocks, 'focus')
  const meetingMinutes = minutesIn(blocks, 'meeting')
  const messagingMinutes = minutesIn(blocks, 'comms')
  const adhocMinutes = minutesIn(blocks, 'possible-adhoc')
  const focusRate = workingMinutesPerDay > 0 ? (focusMinutes / workingMinutesPerDay) * 100 : 0

  const messages = day?.messages || []
  let firstMessage = null
  if (messages.length) {
    const earliest = Math.min(...messages.map((m) => m.timestamp))
    const d = new Date(earliest)
    const minute = d.getHours() * 60 + d.getMinutes()
    firstMessage = {
      timestamp: earliest,
      label: minutesToTimeLabel(minute),
      beforeWorkStart: minute < parseTimeToMinutes(workingStart),
    }
  }

  return {
    dateKey: day?.dateKey,
    weekday: day?.dateKey ? weekdayName(day.dateKey) : null,
    focusMinutes,
    meetingMinutes,
    messagingMinutes,
    adhocMinutes,
    focusRate,
    longestFocusBlock: longestFocusBlock(blocks),
    firstMessage,
  }
}

// --- Summary sentences ----------------------------------------------------

// Plain-English weekly summary, template chosen by focus rate.
export function weeklySummarySentence(insights) {
  const focusStr = formatDuration(insights.focusMinutes)
  const meetingStr = formatDuration(insights.meetingMinutes)
  const window = insights.focusWindows?.top?.label
  const bestDay = insights.mostFocusedDay?.weekday

  if (insights.totalWorkingMinutes === 0) {
    return 'No working days in this range yet.'
  }

  if (insights.focusRate < 20) {
    const dayPart = bestDay
      ? `${bestDay} was your only day with a significant focus block.`
      : 'There were no significant focus blocks.'
    return `A meeting-heavy week — ${meetingStr} in meetings left only ${focusStr} for deep focus. ${dayPart}`
  }

  if (insights.focusRate > 50) {
    const wherePart = window ? `mostly around ${window}.` : ''
    return `Light on meetings this week. You had ${focusStr} of deep focus, ${wherePart}`.trim()
  }

  const windowPart = window ? `your best window was ${window}` : 'your focus was spread through the day'
  const dayPart = bestDay ? ` and ${bestDay} was your most focused day` : ''
  return `This week you had ${focusStr} of deep focus — ${windowPart}${dayPart}.`
}

// Plain-English single-day summary.
export function dailySummarySentence(dayInsight) {
  const focusStr = formatDuration(dayInsight.focusMinutes)
  const meetingStr = formatDuration(dayInsight.meetingMinutes)
  const weekday = dayInsight.weekday || 'This day'

  if (dayInsight.focusMinutes === 0 && dayInsight.meetingMinutes === 0) {
    return `No tracked activity for ${weekday}.`
  }
  if (dayInsight.focusRate < 20) {
    return `${weekday} was meeting-heavy — ${meetingStr} in meetings and just ${focusStr} of deep focus.`
  }
  if (dayInsight.focusRate > 50) {
    return `A focused ${weekday} — ${focusStr} of deep focus with only ${meetingStr} in meetings.`
  }
  const longest = dayInsight.longestFocusBlock
  const longestPart = longest
    ? ` Your longest focus block was ${formatDuration(longest.minutes)}.`
    : ''
  return `On ${weekday} you had ${focusStr} of deep focus and ${meetingStr} in meetings.${longestPart}`
}

// Re-export for convenience so UI can pull labels from one place.
export { CATEGORY_LABELS }
