// Client-side weekly PDF export (jsPDF, loaded locally — no network).
// Exports the FULL report: Overview, Meetings, Focus, Messaging and Trends.

import { jsPDF } from 'jspdf'
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from '../analysis/classify.js'
import { weeklySummarySentence } from '../analysis/insights.js'
import { formatDuration, fromDateKey, minutesToTimeLabel } from '../utils/time.js'
import { isoWeekKey } from '../utils/ranges.js'
import { backToBack, interMeetingGaps, longestMeetingBlock } from '../analysis/meetings.js'
import { recurringAudit } from '../analysis/recurring.js'
import {
  meetingMultitasking,
  contextSwitching,
  quietestHour,
  responsePattern,
  teamsVsSlack,
  messageVolumeByHour,
  declineCandidates,
} from '../analysis/messaging.js'
import {
  focusBlockDistribution,
  morningAfternoonSplit,
  focusConsistency,
  longestFocusBlockInRange,
} from '../analysis/focus.js'
import { computeTrendStats } from '../analysis/trends.js'

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

// --- Overview data (also used by tests) -----------------------------------
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

// --- PDF layout engine ----------------------------------------------------
// One cursor tracks the baseline Y of the *next* line. Every helper reserves
// space (paginating if needed) and advances Y by a proper line-height, so
// nothing overlaps and nothing runs off the page.
const PAGE_H = 842
const TOP = 56
const MARGIN = 44
const BOTTOM = PAGE_H - 48
const WIDTH = 595 - MARGIN * 2

const lh = (size) => Math.round(size * 1.45)

function makeCursor() {
  return { y: TOP }
}

// Reserve `needed` pts of vertical space, starting a new page if it won't fit.
function reserve(doc, cur, needed) {
  if (cur.y + needed > BOTTOM) {
    doc.addPage()
    cur.y = TOP
  }
}

function gap(cur, pts) {
  cur.y += pts
}

// Write one or more wrapped lines of body text; advances the cursor.
function text(doc, cur, str, { size = 10, color = '#1f2933', x = MARGIN, maxWidth = WIDTH } = {}) {
  doc.setFontSize(size)
  doc.setTextColor(color)
  doc.setFont('helvetica', 'normal')
  for (const ln of doc.splitTextToSize(String(str), maxWidth)) {
    reserve(doc, cur, lh(size))
    doc.text(ln, x, cur.y)
    cur.y += lh(size)
  }
}

// Section heading with an underline rule and breathing room above/below.
function heading(doc, cur, str) {
  gap(cur, 16)
  reserve(doc, cur, lh(14) + 10)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor('#1f2933')
  doc.text(str, MARGIN, cur.y)
  doc.setDrawColor('#e5e7eb')
  doc.line(MARGIN, cur.y + 6, MARGIN + WIDTH, cur.y + 6)
  doc.setFont('helvetica', 'normal')
  cur.y += lh(14) + 8
}

// A coloured swatch + label + right-aligned value on one row.
function swatchRow(doc, cur, color, label, value) {
  const rowH = 18
  reserve(doc, cur, rowH)
  doc.setFillColor(color)
  doc.rect(MARGIN, cur.y - 8, 10, 10, 'F')
  doc.setFontSize(10)
  doc.setTextColor('#1f2933')
  doc.text(label, MARGIN + 18, cur.y)
  doc.setTextColor('#6b7280')
  doc.text(String(value), MARGIN + WIDTH, cur.y, { align: 'right' })
  cur.y += rowH
}

// Stamp "Watermelon · weekKey · page x/y" on the footer of every page.
function stampFooter(doc, weekKey) {
  const n = doc.getNumberOfPages()
  for (let i = 1; i <= n; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor('#9aa3ad')
    doc.text(`Watermelon  ·  ${weekKey}  ·  ${i}/${n}`, MARGIN, PAGE_H - 26)
  }
}

// --- Section data (pure, testable) ----------------------------------------
// Returns the Meetings/Focus/Messaging/Trends sections as { title, lines }.
export function reportSections({ insights, days = [], workingStart = '09:00', workingEnd = '18:00', weeks = [] }) {
  const sections = []

  // Meetings
  const b2b = backToBack(days)
  const gaps = interMeetingGaps(days)
  const longestMtg = longestMeetingBlock(days)
  const recurring = recurringAudit({ weeks: [], days, top: 5 })
  const decline = declineCandidates(days)
  const meetingLines = [
    `Back-to-back: ${Math.round(b2b.rate)}% (${b2b.count} of ${b2b.totalMeetings} ran straight into the next).`,
    `Inter-meeting gaps: ${gaps.tooShortCount} too short to use, costing ${formatDuration(gaps.tooShortMinutes)}.`,
    longestMtg
      ? `Longest unbroken meeting block: ${formatDuration(longestMtg.minutes)} on ${longestMtg.weekday}.`
      : 'No back-to-back meeting blocks.',
    ...recurring.items.map(
      (m) => `• ${m.title} — ${formatDuration(m.totalMinutes)} (${m.occurrences}×, ${formatDuration(m.averageMinutes)} avg)`,
    ),
    ...decline.map((c) => `• Decline candidate: ${c.title} — ${Math.round(c.avgMessages)} msgs/occurrence`),
  ]
  sections.push({ title: 'Meetings', lines: meetingLines })

  // Focus
  const dist = focusBlockDistribution(days)
  const split = morningAfternoonSplit(days)
  const consistency = focusConsistency(days)
  const longestFocus = longestFocusBlockInRange(days)
  const focusLines = [
    insights.focusByDay?.best
      ? `Best focus day: ${insights.focusByDay.best.weekday} (${formatDuration(insights.focusByDay.best.focusMinutes)}).`
      : 'No standout focus day.',
    insights.focusWindows?.top ? `Best focus window: ${insights.focusWindows.top.label} on average.` : '',
    `Focus came in ${dist.totalBlocks} blocks, averaging ${dist.averageMinutes} min each.`,
    `Morning ${split.morningPct}% (${formatDuration(split.morningMinutes)}) · Afternoon ${split.afternoonPct}% (${formatDuration(split.afternoonMinutes)}).`,
    `Consistency: ${consistency.level}.`,
    longestFocus
      ? `Longest focus block: ${formatDuration(longestFocus.minutes)} on ${longestFocus.weekday} at ${minutesToTimeLabel(longestFocus.startMinute)}.`
      : '',
  ].filter(Boolean)
  sections.push({ title: 'Focus', lines: focusLines })

  // Messaging
  const vol = messageVolumeByHour(days, workingStart, workingEnd)
  const multi = meetingMultitasking(days)
  const ctx = contextSwitching(days)
  const quiet = quietestHour(days, workingStart, workingEnd)
  const resp = responsePattern(days)
  const plat = teamsVsSlack(days)
  const messagingLines = [
    vol.busiest ? `Busiest messaging hour: ${vol.busiest.label} (${vol.busiest.total} messages).` : '',
    `Messages sent during meetings: ${multi.total}.`,
    `Context switches: ${ctx.total} this week.`,
    quiet ? `Quietest messaging hour: ${quiet.label}.` : '',
    resp.sufficient
      ? `Response pattern: ${resp.immediate}% immediate · ${resp.considered}% considered · ${resp.async}% async.`
      : 'Response pattern: not enough data.',
    `Platform split: ${plat.teamsPct}% Teams · ${plat.slackPct}% Slack.`,
  ].filter(Boolean)
  sections.push({ title: 'Messaging', lines: messagingLines })

  // Trends
  const stats = computeTrendStats(weeks)
  if (stats.hasEnough) {
    sections.push({
      title: 'Trends',
      lines: [
        stats.sentence,
        `Best week: ${stats.bestWeek.focusRate}% (${stats.bestWeek.weekKey}).`,
        `Focus rate vs last week: ${stats.focusDelta >= 0 ? '+' : ''}${stats.focusDelta}%.`,
      ],
    })
  }

  return sections
}

// --- Section renderers ----------------------------------------------------
function drawHeader(doc, cur, data) {
  reserve(doc, cur, lh(22))
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor('#1f2933')
  doc.text('Watermelon — Weekly report', MARGIN, cur.y)
  cur.y += lh(22)
  doc.setFont('helvetica', 'normal')
  text(doc, cur, `${data.rangeLabel}  ·  ${data.weekKey}`, { size: 11, color: '#6b7280' })
  gap(cur, 10)
}

function drawOverview(doc, cur, insights) {
  const data = pdfReportData(insights)

  // Focus-rate hero: big number + label baseline-aligned, then the sentence.
  reserve(doc, cur, lh(28))
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(28)
  doc.setTextColor('#4CAF82')
  doc.text(`${data.focusRate}%`, MARGIN, cur.y)
  const pctWidth = doc.getTextWidth(`${data.focusRate}%`)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(11)
  doc.setTextColor('#6b7280')
  doc.text('focus rate', MARGIN + pctWidth + 10, cur.y)
  cur.y += lh(28)
  gap(cur, 2)
  text(doc, cur, data.sentence, { size: 11 })

  heading(doc, cur, 'Time breakdown')
  for (const c of data.categories) {
    swatchRow(doc, cur, c.color, c.label, `${formatDuration(c.minutes)}  ·  ${c.pct}%`)
  }

  heading(doc, cur, 'Per-day breakdown')
  const barX = MARGIN + 90
  const barMax = WIDTH - 90
  for (const d of data.perDay) {
    const rowH = 18
    reserve(doc, cur, rowH)
    const total = CATEGORIES.reduce((a, k) => a + (d.categories[k] || 0), 0) || 1
    doc.setFontSize(9)
    doc.setTextColor('#6b7280')
    doc.text(d.weekday, MARGIN, cur.y) // baseline aligned with the bar
    let x = barX
    for (const k of CATEGORIES) {
      const w = ((d.categories[k] || 0) / total) * barMax
      if (w <= 0) continue
      doc.setFillColor(CATEGORY_COLORS[k])
      doc.rect(x, cur.y - 8, w, 9, 'F')
      x += w
    }
    cur.y += rowH
  }
  gap(cur, 4)
  text(doc, cur, `Best focus window: ${data.bestWindow}`, { size: 10, color: '#6b7280' })
}

// --- Public API -----------------------------------------------------------
export function buildWeeklyPdf(payload) {
  const { insights } = payload
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = makeCursor()
  const data = pdfReportData(insights)

  drawHeader(doc, cur, data)
  drawOverview(doc, cur, insights)
  for (const section of reportSections(payload)) {
    heading(doc, cur, section.title)
    for (const ln of section.lines) text(doc, cur, ln, { size: 10 })
  }

  stampFooter(doc, data.weekKey)
  return { doc, filename: data.filename }
}

export function exportWeeklyPdf(payload) {
  const { doc, filename } = buildWeeklyPdf(payload)
  doc.save(filename)
  return filename
}
