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

// --- PDF drawing helpers --------------------------------------------------
const PAGE_H = 842
const MARGIN = 40
const BOTTOM = PAGE_H - 40
const WIDTH = 515

function makeCursor() {
  return { y: 56 }
}
function ensure(doc, cur, needed) {
  if (cur.y + needed > BOTTOM) {
    doc.addPage()
    cur.y = 56
  }
}
function heading(doc, cur, text) {
  ensure(doc, cur, 30)
  cur.y += 8
  doc.setFontSize(15)
  doc.setTextColor('#1f2933')
  doc.text(text, MARGIN, cur.y)
  doc.setDrawColor('#e5e7eb')
  doc.line(MARGIN, cur.y + 4, MARGIN + WIDTH, cur.y + 4)
  cur.y += 18
}
function line(doc, cur, text, { size = 10, color = '#1f2933', indent = 0 } = {}) {
  doc.setFontSize(size)
  doc.setTextColor(color)
  const lines = doc.splitTextToSize(text, WIDTH - indent)
  for (const ln of lines) {
    ensure(doc, cur, 14)
    doc.text(ln, MARGIN + indent, cur.y)
    cur.y += 14
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
function drawOverview(doc, cur, insights) {
  const data = pdfReportData(insights)

  doc.setFontSize(20)
  doc.setTextColor('#1f2933')
  doc.text('Watermelon — Weekly report', MARGIN, cur.y)
  cur.y += 18
  doc.setFontSize(11)
  doc.setTextColor('#6b7280')
  doc.text(`${data.rangeLabel}  ·  ${data.weekKey}`, MARGIN, cur.y)
  cur.y += 26

  doc.setTextColor('#4CAF82')
  doc.setFontSize(30)
  doc.text(`${data.focusRate}%`, MARGIN, cur.y)
  doc.setFontSize(11)
  doc.setTextColor('#6b7280')
  doc.text('focus rate', MARGIN + 64, cur.y)
  cur.y += 22
  line(doc, cur, data.sentence)

  heading(doc, cur, 'Time breakdown')
  for (const c of data.categories) {
    ensure(doc, cur, 16)
    doc.setFillColor(c.color)
    doc.rect(MARGIN, cur.y - 8, 10, 10, 'F')
    doc.setFontSize(10)
    doc.setTextColor('#1f2933')
    doc.text(c.label, MARGIN + 18, cur.y)
    doc.setTextColor('#6b7280')
    doc.text(`${formatDuration(c.minutes)}  ·  ${c.pct}%`, MARGIN + 230, cur.y)
    cur.y += 16
  }

  heading(doc, cur, 'Per-day breakdown')
  for (const d of data.perDay) {
    ensure(doc, cur, 16)
    const total = CATEGORIES.reduce((a, k) => a + (d.categories[k] || 0), 0) || 1
    doc.setFontSize(9)
    doc.setTextColor('#6b7280')
    doc.text(d.weekday, MARGIN, cur.y + 8)
    let x = MARGIN + 90
    for (const k of CATEGORIES) {
      const w = ((d.categories[k] || 0) / total) * 360
      if (w <= 0) continue
      doc.setFillColor(CATEGORY_COLORS[k])
      doc.rect(x, cur.y, w, 10, 'F')
      x += w
    }
    cur.y += 16
  }
  line(doc, cur, `Best focus window: ${data.bestWindow}`)
}

// --- Public API -----------------------------------------------------------
export function buildWeeklyPdf(payload) {
  const { insights } = payload
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const cur = makeCursor()

  drawOverview(doc, cur, insights)
  for (const section of reportSections(payload)) {
    heading(doc, cur, section.title)
    for (const ln of section.lines) line(doc, cur, ln)
  }

  return { doc, filename: weekPdfFilename(pdfReportData(insights).weekKey) }
}

export function exportWeeklyPdf(payload) {
  const { doc, filename } = buildWeeklyPdf(payload)
  doc.save(filename)
  return filename
}
