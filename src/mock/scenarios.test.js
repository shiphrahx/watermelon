import { describe, it, expect } from 'vitest'
import { buildRecentDataset, datasetDays, dateKeyOf } from './generator.js'
import { buildReport } from '../analysis/report.js'
import { backToBack, fragmentation } from '../analysis/meetings.js'
import { weekdayName } from '../analysis/insights.js'

// Fixed Wednesday so the dataset deterministically covers full working weeks.
const TODAY = new Date(2025, 5, 25)

function reportForDataset() {
  const days = datasetDays(TODAY)
  const dataset = buildRecentDataset(TODAY)
  const { days: out } = buildReport({
    startKey: dateKeyOf(days[0]),
    endKey: dateKeyOf(days[days.length - 1]),
    workingStart: '09:00',
    workingEnd: '18:00',
    rawCalendar: dataset.calendarEvents,
    rawTeams: dataset.teamsMessages,
    rawSlack: dataset.slackMessages,
  })
  return out
}

describe('mock scenarios (issue #6)', () => {
  it('generates all five working days (Mon–Fri)', () => {
    const out = reportForDataset()
    const weekdaysWithData = new Set(
      out.filter((d) => d.events.length || d.messages.length).map((d) => weekdayName(d.dateKey)),
    )
    for (const name of ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']) {
      expect(weekdaysWithData).toContain(name)
    }
  })

  it('includes back-to-back meetings on at least two days', () => {
    const out = reportForDataset()
    const b2b = backToBack(out, 5)
    expect(b2b.count).toBeGreaterThanOrEqual(2)
    const distinctDays = new Set(b2b.pairs.map((p) => p.dateKey))
    expect(distinctDays.size).toBeGreaterThanOrEqual(2)
  })

  it('includes inter-meeting gaps under 20 minutes on at least two days', () => {
    const out = reportForDataset()
    const frag = fragmentation(out, 20)
    const daysWithGaps = frag.perDay.filter((d) => d.count > 0)
    expect(daysWithGaps.length).toBeGreaterThanOrEqual(2)
    expect(frag.totalLostMinutes).toBeGreaterThan(0)
  })

  it('dataset always includes the current week through Friday', () => {
    const days = datasetDays(TODAY)
    expect(dateKeyOf(days[days.length - 1])).toBe('2025-06-27') // Fri of that week
  })
})
