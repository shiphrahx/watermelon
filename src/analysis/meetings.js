// Meetings-tab analytics: top consumers, back-to-back rate, fragmentation,
// recovery time, and the longest unbroken meeting block. Pure functions over a
// report's `days` (each day has normalized `events` with Date start/end).

import { parseTimeToMinutes } from '../utils/time.js'
import { isWeekday } from '../utils/ranges.js'
import { weekdayName } from './insights.js'

const durationMin = (e) => Math.max(0, Math.round((e.end.getTime() - e.start.getTime()) / 60000))

// Accepted meetings for a day, sorted by start time. (Normalized events already
// exclude declined/all-day.)
function dayMeetings(day) {
  return [...(day.events || [])].sort((a, b) => a.start.getTime() - b.start.getTime())
}

function weekdays(days) {
  return days.filter((d) => isWeekday(d.dateKey))
}

// Top 5 event titles by cumulative duration; repeated titles merged.
export function topConsumers(days, limit = 5) {
  const byTitle = new Map()
  for (const d of weekdays(days)) {
    for (const e of d.events || []) {
      const mins = durationMin(e)
      if (mins <= 0) continue
      const prev = byTitle.get(e.subject) || { minutes: 0, occurrences: 0 }
      byTitle.set(e.subject, { minutes: prev.minutes + mins, occurrences: prev.occurrences + 1 })
    }
  }
  return [...byTitle.entries()]
    .map(([subject, v]) => ({ subject, minutes: v.minutes, occurrences: v.occurrences }))
    .sort((a, b) => b.minutes - a.minutes)
    .slice(0, limit)
}

// Percentage of meetings starting within `thresholdMin` of the previous ending.
export function backToBack(days, thresholdMin = 5) {
  let totalMeetings = 0
  const pairs = []
  for (const d of weekdays(days)) {
    const meetings = dayMeetings(d)
    totalMeetings += meetings.length
    for (let i = 1; i < meetings.length; i++) {
      const gap = Math.round((meetings[i].start.getTime() - meetings[i - 1].end.getTime()) / 60000)
      if (gap >= 0 && gap <= thresholdMin) {
        pairs.push({
          dateKey: d.dateKey,
          weekday: weekdayName(d.dateKey),
          from: meetings[i - 1].subject,
          to: meetings[i].subject,
          gapMinutes: gap,
        })
      }
    }
  }
  const count = pairs.length
  const rate = totalMeetings > 0 ? (count / totalMeetings) * 100 : 0
  return { totalMeetings, count, rate, pairs }
}

// Gaps between accepted meetings shorter than `maxGap` minutes (excludes the
// gaps before the first / after the last meeting of the day).
export function fragmentation(days, maxGap = 20) {
  const perDay = []
  let totalLost = 0
  for (const d of weekdays(days)) {
    const meetings = dayMeetings(d)
    let count = 0
    let lost = 0
    for (let i = 1; i < meetings.length; i++) {
      const gap = Math.round((meetings[i].start.getTime() - meetings[i - 1].end.getTime()) / 60000)
      if (gap > 0 && gap < maxGap) {
        count++
        lost += gap
      }
    }
    if (meetings.length > 0) {
      perDay.push({ dateKey: d.dateKey, weekday: weekdayName(d.dateKey), count, lostMinutes: lost })
    }
    totalLost += lost
  }
  return { perDay, totalLostMinutes: totalLost }
}

// Distribution of real gaps (> 0 min) between accepted meetings, bucketed by
// usefulness. Back-to-back meetings (0-min) are not gaps and are excluded.
export function interMeetingGaps(days) {
  const gaps = []
  for (const d of weekdays(days)) {
    const meetings = dayMeetings(d)
    for (let i = 1; i < meetings.length; i++) {
      const gap = Math.round((meetings[i].start.getTime() - meetings[i - 1].end.getTime()) / 60000)
      if (gap > 0) gaps.push(gap)
    }
  }

  const defs = [
    { key: 'tooShort', label: 'Too short to use', test: (g) => g < 20 },
    { key: 'short', label: 'Short', test: (g) => g >= 20 && g <= 30 },
    { key: 'comfortable', label: 'Comfortable', test: (g) => g > 30 && g <= 60 },
    { key: 'long', label: 'Long', test: (g) => g > 60 },
  ]
  const buckets = defs.map((def) => {
    const xs = gaps.filter(def.test)
    return {
      key: def.key,
      label: def.label,
      count: xs.length,
      minutes: xs.reduce((a, b) => a + b, 0),
    }
  })
  const tooShort = buckets.find((b) => b.key === 'tooShort')
  return {
    buckets,
    totalGaps: gaps.length,
    tooShortCount: tooShort.count,
    tooShortMinutes: tooShort.minutes,
  }
}

// Longest continuous chain of meetings with gaps under `gapThreshold` minutes.
export function longestMeetingBlock(days, gapThreshold = 10) {
  let best = null
  for (const d of weekdays(days)) {
    const meetings = dayMeetings(d)
    if (meetings.length === 0) continue
    let chainStart = meetings[0].start
    let chainEnd = meetings[0].end
    let chainCount = 1
    const consider = () => {
      // A "block" needs at least two meetings chained together.
      if (chainCount < 2) return
      const minutes = Math.round((chainEnd.getTime() - chainStart.getTime()) / 60000)
      if (!best || minutes > best.minutes) {
        best = { dateKey: d.dateKey, weekday: weekdayName(d.dateKey), minutes }
      }
    }
    for (let i = 1; i < meetings.length; i++) {
      const gap = Math.round((meetings[i].start.getTime() - chainEnd.getTime()) / 60000)
      if (gap <= gapThreshold) {
        if (meetings[i].end > chainEnd) chainEnd = meetings[i].end
        chainCount++
      } else {
        consider()
        chainStart = meetings[i].start
        chainEnd = meetings[i].end
        chainCount = 1
      }
    }
    consider()
  }
  return best
}

export { parseTimeToMinutes }
