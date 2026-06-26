// Seed deterministic mock history so trend/comparison features have multiple
// weeks of data to work with in mock mode. Only runs for weeks not already
// stored, so real computed weeks are never overwritten.

import { generateDay, PROFILE_SEQUENCE } from './generator.js'
import { buildReport } from '../analysis/report.js'
import { computeInsights } from '../analysis/insights.js'
import { buildWeekSummary } from '../analysis/weekSummary.js'
import { saveWeek, getWeek } from '../storage/history.js'
import { mondayOf, isoWeekKey } from '../utils/ranges.js'
import { toDateKey } from '../utils/time.js'
import { getSettings } from '../utils/settings.js'

function addDays(date, n) {
  const d = new Date(date.getTime())
  d.setDate(d.getDate() + n)
  return d
}

// Build one week's raw mock data (Mon–Fri), then summarise and persist it.
function seedWeek(monday, weekOffset, workingStart, workingEnd) {
  const calendarEvents = []
  const teamsMessages = []
  const slackMessages = []
  for (let dow = 0; dow < 5; dow++) {
    const date = addDays(monday, dow)
    // Vary profiles across weeks so the trend lines actually move.
    const profile = PROFILE_SEQUENCE[(weekOffset * 5 + dow) % PROFILE_SEQUENCE.length]
    const day = generateDay(date, profile, { dayIndex: dow })
    calendarEvents.push(...day.calendarEvents)
    teamsMessages.push(...day.teamsMessages)
    slackMessages.push(...day.slackMessages)
  }
  const startKey = toDateKey(monday)
  const endKey = toDateKey(addDays(monday, 4))
  const { days } = buildReport({
    startKey,
    endKey,
    workingStart,
    workingEnd,
    rawCalendar: calendarEvents,
    rawTeams: teamsMessages,
    rawSlack: slackMessages,
  })
  const insights = computeInsights({ days, workingStart, workingEnd })
  saveWeek(isoWeekKey(monday), buildWeekSummary({ insights, days }))
}

// Seed up to `weeks` recent ISO weeks (oldest first), skipping any already
// present so real data wins.
export function seedMockHistory(today = new Date(), weeks = 10) {
  const { workingHoursStart, workingHoursEnd } = getSettings()
  const thisMonday = mondayOf(today)
  for (let w = weeks - 1; w >= 0; w--) {
    const monday = addDays(thisMonday, -w * 7)
    if (getWeek(isoWeekKey(monday))) continue // don't overwrite existing
    seedWeek(monday, weeks - 1 - w, workingHoursStart, workingHoursEnd)
  }
}
