// Client-side weekly PDF export (jsPDF, loaded locally — no network).

import { jsPDF } from 'jspdf'
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from '../analysis/classify.js'
import { weeklySummarySentence } from '../analysis/insights.js'
import { formatDuration, fromDateKey } from '../utils/time.js'
import { isoWeekKey } from '../utils/ranges.js'

// Map a category key to its minutes within the insights summary.
const MINUTES_FIELD = {
  meeting: 'meetingMinutes',
  focus: 'focusMinutes',
  comms: 'messagingMinutes',
  shallow: 'shallowMinutes',
}

export function weekPdfFilename(weekKey) {
  return `watermelon-week-${weekKey}.pdf`
}

function prettyDate(dateKey) {
  return fromDateKey(dateKey).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

// Pure data prep for the report — easy to test without touching jsPDF.
export function pdfReportData(insights) {
  const weekdays = (insights.perDay || []).filter((d) => d.isWeekday)
  const first = weekdays[0]?.dateKey
  const last = weekdays[weekdays.length - 1]?.dateKey
  const weekKey = first ? isoWeekKey(first) : 'unknown'

  const categories = CATEGORIES.map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    color: CATEGORY_COLORS[key],
    minutes: insights[MINUTES_FIELD[key]] || 0,
  }))
  const totalActive = categories.reduce((a, c) => a + c.minutes, 0) || 1
  for (const c of categories) c.pct = Math.round((c.minutes / totalActive) * 100)

  return {
    weekKey,
    filename: weekPdfFilename(weekKey),
    rangeLabel: first && last ? `${prettyDate(first)} – ${prettyDate(last)}` : '',
    focusRate: Math.round(insights.focusRate),
    categories,
    perDay: weekdays,
    bestWindow: insights.focusWindows?.top?.label || '—',
    sentence: weeklySummarySentence(insights),
  }
}

// Build the one-page PDF document (does not save). Returns { doc, filename }.
export function buildWeeklyPdf(insights) {
  const data = pdfReportData(insights)
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const M = 40 // left margin
  let y = 56

  doc.setFontSize(20)
  doc.setTextColor('#1f2933')
  doc.text('Watermelon — Weekly report', M, y)
  y += 20
  doc.setFontSize(11)
  doc.setTextColor('#6b7280')
  doc.text(`${data.rangeLabel}  ·  ${data.weekKey}`, M, y)

  // Focus rate hero
  y += 40
  doc.setTextColor('#4CAF82')
  doc.setFontSize(34)
  doc.text(`${data.focusRate}%`, M, y)
  doc.setFontSize(11)
  doc.setTextColor('#6b7280')
  doc.text('focus rate', M + 70, y)

  // Summary sentence
  y += 28
  doc.setTextColor('#1f2933')
  doc.setFontSize(11)
  doc.text(doc.splitTextToSize(data.sentence, 515), M, y)

  // Category breakdown
  y += 44
  doc.setFontSize(13)
  doc.text('Time breakdown', M, y)
  y += 16
  doc.setFontSize(10)
  for (const c of data.categories) {
    doc.setFillColor(c.color)
    doc.rect(M, y - 8, 10, 10, 'F')
    doc.setTextColor('#1f2933')
    doc.text(`${c.label}`, M + 18, y)
    doc.setTextColor('#6b7280')
    doc.text(`${formatDuration(c.minutes)}  ·  ${c.pct}%`, M + 220, y)
    y += 18
  }

  // Per-day stacked breakdown
  y += 16
  doc.setFontSize(13)
  doc.setTextColor('#1f2933')
  doc.text('Per-day breakdown', M, y)
  y += 14
  const barW = 360
  for (const d of data.perDay) {
    const total = CATEGORIES.reduce((a, k) => a + (d.categories[k] || 0), 0) || 1
    let x = M + 90
    doc.setFontSize(9)
    doc.setTextColor('#6b7280')
    doc.text(d.weekday, M, y + 8)
    for (const k of CATEGORIES) {
      const w = ((d.categories[k] || 0) / total) * barW
      if (w <= 0) continue
      doc.setFillColor(CATEGORY_COLORS[k])
      doc.rect(x, y, w, 10, 'F')
      x += w
    }
    y += 18
  }

  // Best focus window
  y += 16
  doc.setFontSize(11)
  doc.setTextColor('#1f2933')
  doc.text(`Best focus window: ${data.bestWindow}`, M, y)

  return { doc, filename: data.filename }
}

export function exportWeeklyPdf(insights) {
  const { doc, filename } = buildWeeklyPdf(insights)
  doc.save(filename)
  return filename
}
