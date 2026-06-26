import { describe, it, expect } from 'vitest'
import { pdfReportData, weekPdfFilename, buildWeeklyPdf } from './weeklyPdf.js'
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

describe('buildWeeklyPdf', () => {
  it('builds a jsPDF document without throwing and returns the filename', () => {
    const { doc, filename } = buildWeeklyPdf(insights)
    expect(filename).toMatch(/^watermelon-week-.*\.pdf$/)
    // a real jsPDF doc exposes output()
    expect(typeof doc.output).toBe('function')
  })
})
