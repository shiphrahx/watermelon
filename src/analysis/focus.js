// Focus-tab analytics: block-size distribution, morning/afternoon split, focus
// consistency, and the single longest focus block. Pure over a report's `days`.

import { BLOCK_MINUTES, parseTimeToMinutes } from '../utils/time.js'
import { isWeekday } from '../utils/ranges.js'
import { weekdayName } from './insights.js'

function weekdays(days) {
  return days.filter((d) => isWeekday(d.dateKey))
}

// Merge consecutive focus blocks in a day into runs with start minute + length.
export function focusRuns(blocks) {
  const runs = []
  let cur = null
  for (const b of blocks) {
    if (b.category === 'focus') {
      if (cur && cur.endMinute === b.startMinute) {
        cur.endMinute = b.endMinute
        cur.minutes += BLOCK_MINUTES
      } else {
        cur = { startMinute: b.startMinute, endMinute: b.endMinute, minutes: BLOCK_MINUTES }
        runs.push(cur)
      }
    } else {
      cur = null
    }
  }
  return runs
}

function allFocusRuns(days) {
  return weekdays(days).flatMap((d) => focusRuns(d.blocks))
}

// Distribution of focus runs by size bucket. Sub-20-min runs are shown for
// transparency but excluded from counted focus time (per the classifier rule).
export function focusBlockDistribution(days) {
  const runs = allFocusRuns(days)
  const buckets = [
    { key: 'under20', label: 'Under 20 min', counted: false, min: 0, max: 20 },
    { key: '20to30', label: '20–30 min', counted: true, min: 20, max: 30 },
    { key: '30to60', label: '30–60 min', counted: true, min: 30, max: 60 },
    { key: 'over60', label: 'Over 60 min', counted: true, min: 60, max: Infinity },
  ].map((b) => ({ ...b, count: 0, minutes: 0 }))

  for (const run of runs) {
    const bucket =
      run.minutes < 20
        ? buckets[0]
        : run.minutes <= 30
          ? buckets[1]
          : run.minutes <= 60
            ? buckets[2]
            : buckets[3]
    bucket.count++
    bucket.minutes += run.minutes
  }

  const countedRuns = runs.filter((r) => r.minutes >= 20)
  const totalMinutes = countedRuns.reduce((a, r) => a + r.minutes, 0)
  const totalBlocks = countedRuns.length
  const averageMinutes = totalBlocks ? Math.round(totalMinutes / totalBlocks) : 0
  return { buckets, totalMinutes, totalBlocks, averageMinutes }
}

// Share of focus time before noon vs after noon.
export function morningAfternoonSplit(days, noonMinute = 12 * 60) {
  let morning = 0
  let afternoon = 0
  for (const run of allFocusRuns(days)) {
    // Attribute each block within the run to morning/afternoon by its start.
    for (let m = run.startMinute; m < run.endMinute; m += BLOCK_MINUTES) {
      if (m < noonMinute) morning += BLOCK_MINUTES
      else afternoon += BLOCK_MINUTES
    }
  }
  const total = morning + afternoon
  const morningPct = total ? Math.round((morning / total) * 100) : 0
  const afternoonPct = total ? 100 - morningPct : 0
  const better = total === 0 ? null : morning >= afternoon ? 'morning' : 'afternoon'
  return { morningMinutes: morning, afternoonMinutes: afternoon, morningPct, afternoonPct, better }
}

function stddev(values) {
  if (values.length < 2) return 0
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((a, v) => a + (v - mean) ** 2, 0) / values.length
  return Math.sqrt(variance)
}

// Consistency of focus timing: stddev (minutes) of each day's first focus-block
// start, plus per-day start times for the dot plot.
export function focusConsistency(days) {
  const perDay = []
  const firstStarts = []
  for (const d of weekdays(days)) {
    const runs = focusRuns(d.blocks)
    const starts = runs.map((r) => r.startMinute)
    perDay.push({ dateKey: d.dateKey, weekday: weekdayName(d.dateKey), starts })
    if (starts.length) firstStarts.push(starts[0])
  }
  const variance = Math.round(stddev(firstStarts))
  let level
  if (firstStarts.length < 2) level = 'insufficient'
  else if (variance < 45) level = 'low'
  else if (variance <= 90) level = 'medium'
  else level = 'high'
  return { varianceMinutes: variance, level, perDay }
}

// The single longest uninterrupted focus block in the range.
export function longestFocusBlockInRange(days) {
  let best = null
  for (const d of weekdays(days)) {
    for (const run of focusRuns(d.blocks)) {
      if (!best || run.minutes > best.minutes) {
        best = {
          dateKey: d.dateKey,
          weekday: weekdayName(d.dateKey),
          minutes: run.minutes,
          startMinute: run.startMinute,
        }
      }
    }
  }
  return best
}
