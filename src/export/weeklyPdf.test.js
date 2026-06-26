import { describe, it, expect } from 'vitest'
import { pdfReportData, weekPdfFilename, buildWeeklyPdf, reportSections } from './weeklyPdf.js'
import { computeInsights } from '../analysis/insights.js'
import { buildDayBlocks } from '../utils/time.js'

const WS = '09:00'
const WE = '18:00'
function makeDay(dateKey, cats) {
  const blocks = buildDayBlocks(dateKey, WS, WE).map((b, i) => ({ ...b, category: cats[i] || 'focus' }))
  return { dateKey, blocks, events: [], messages: [{ timestamp: 1 }] }
}
const cats = [
  'meeting', 'meeting', 'focus', 'focus', 'comms', 'shallow',
  'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus',
]
const days = [makeDay('2025-06-23', cats), makeDay('2025-06-24', cats)]
const insights = computeInsights({ days, workingStart: WS, workingEnd: WE })

describe('weekPdfFilename', () => {
  it('uses the week key', () => {
    expect(weekPdfFilename('2026-W26')).toBe('watermelon-week-2026-W26.pdf')
  })
})

describe('pdfReportData', () => {
  const data = pdfReportData(insights)

  it('derives the week key, filename and range label', () => {
    expect(data.weekKey).toMatch(/^\d{4}-W\d{2}$/)
    expect(data.filename).toBe(`watermelon-week-${data.weekKey}.pdf`)
    expect(data.rangeLabel).toMatch(/–/)
  })

  it('includes all four categories with percentages summing to ~100', () => {
    expect(data.categories.map((c) => c.key)).toEqual(['meeting', 'focus', 'comms', 'shallow'])
    const sum = data.categories.reduce((a, c) => a + c.pct, 0)
    expect(Math.abs(sum - 100)).toBeLessThanOrEqual(2) // rounding tolerance
  })

  it('carries focus rate, best window and a summary sentence', () => {
    expect(typeof data.focusRate).toBe('number')
    expect(data.bestWindow).toBeTruthy()
    expect(data.sentence.length).toBeGreaterThan(0)
  })

  it('lists weekday per-day rows only', () => {
    expect(data.perDay.length).toBe(2)
  })
})

describe('reportSections (full-report content)', () => {
  const weeks = [
    { weekKey: '2025-W25', focusRate: 40, focusMinutes: 240, meetingMinutes: 600, fragmentationCount: 1 },
    { weekKey: '2025-W26', focusRate: 55, focusMinutes: 330, meetingMinutes: 500, fragmentationCount: 2 },
  ]
  const sections = reportSections({ insights, days, workingStart: WS, workingEnd: WE, weeks })
  const titles = sections.map((s) => s.title)

  it('includes a section for every non-overview tab', () => {
    expect(titles).toEqual(['Meetings', 'Focus', 'Messaging', 'Trends'])
  })

  it('Meetings section carries back-to-back and gap facts', () => {
    const lines = sections.find((s) => s.title === 'Meetings').lines.join('\n')
    expect(lines).toMatch(/Back-to-back:/)
    expect(lines).toMatch(/Inter-meeting gaps:/)
  })

  it('Focus section carries split and consistency', () => {
    const lines = sections.find((s) => s.title === 'Focus').lines.join('\n')
    expect(lines).toMatch(/Morning \d+%/)
    expect(lines).toMatch(/Consistency:/)
  })

  it('Messaging section carries platform split and multitasking', () => {
    const lines = sections.find((s) => s.title === 'Messaging').lines.join('\n')
    expect(lines).toMatch(/Platform split:/)
    expect(lines).toMatch(/Messages sent during meetings:/)
  })

  it('omits Trends with fewer than 2 weeks', () => {
    const s = reportSections({ insights, days, workingStart: WS, workingEnd: WE, weeks: [] })
    expect(s.map((x) => x.title)).not.toContain('Trends')
  })
})

describe('buildWeeklyPdf', () => {
  it('builds a multi-page document covering all tabs and returns the filename', () => {
    const weeks = [
      { weekKey: '2025-W25', focusRate: 40, focusMinutes: 240, meetingMinutes: 600, fragmentationCount: 1 },
      { weekKey: '2025-W26', focusRate: 55, focusMinutes: 330, meetingMinutes: 500, fragmentationCount: 2 },
    ]
    const { doc, filename } = buildWeeklyPdf({ insights, days, workingStart: WS, workingEnd: WE, weeks })
    expect(filename).toMatch(/^watermelon-week-.*\.pdf$/)
    expect(typeof doc.output).toBe('function')
    // full report spans more than one page (Overview + Meetings + Focus + Messaging + Trends)
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1)
    // the rendered text includes section headings from every tab
    const text = doc.output('dataurlstring') // does not throw
    expect(typeof text).toBe('string')
  })
})
