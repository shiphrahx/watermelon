// Messaging-tab analytics: volume by hour, meeting multitasking, context
// switching, quietest hour, response pattern, and Teams/Slack split.
//
// Messages are normalized: { timestamp, source: 'teams'|'slack', channel?, chatId? }.
// A "conversation" id is channel (Slack) or chatId (Teams).

import { parseTimeToMinutes, minutesToTimeLabel } from '../utils/time.js'
import { isWeekday } from '../utils/ranges.js'
import { weekdayName } from './insights.js'

function weekdays(days) {
  return days.filter((d) => isWeekday(d.dateKey))
}

function allMessages(days) {
  return weekdays(days).flatMap((d) => d.messages || [])
}

function conversationId(m) {
  return m.channel || m.chatId || 'unknown'
}

function minuteOfDay(ts) {
  const d = new Date(ts)
  return d.getHours() * 60 + d.getMinutes()
}

// Total messages per working hour, split by source, with the busiest hour.
export function messageVolumeByHour(days, workingStart, workingEnd) {
  const startMin = parseTimeToMinutes(workingStart)
  const endMin = parseTimeToMinutes(workingEnd)
  const hours = []
  for (let m = startMin; m + 60 <= endMin; m += 60) {
    hours.push({
      startMinute: m,
      label: `${minutesToTimeLabel(m)}–${minutesToTimeLabel(m + 60)}`,
      teams: 0,
      slack: 0,
      total: 0,
    })
  }
  for (const msg of allMessages(days)) {
    const mod = minuteOfDay(msg.timestamp)
    const slot = hours.find((h) => mod >= h.startMinute && mod < h.startMinute + 60)
    if (!slot) continue
    if (msg.source === 'slack') slot.slack++
    else slot.teams++
    slot.total++
  }
  let busiest = null
  for (const h of hours) {
    if (h.total > 0 && (!busiest || h.total > busiest.total)) busiest = h
  }
  return { hours, busiest }
}

// Messages sent during accepted meetings, grouped by meeting title.
export function meetingMultitasking(days) {
  const byTitle = new Map()
  let total = 0
  for (const d of weekdays(days)) {
    const events = d.events || []
    const messages = d.messages || []
    for (const e of events) {
      const s = e.start.getTime()
      const en = e.end.getTime()
      const count = messages.filter((m) => m.timestamp >= s && m.timestamp < en).length
      if (count === 0) continue
      total += count
      const prev = byTitle.get(e.subject) || { messages: 0, occurrences: 0 }
      byTitle.set(e.subject, {
        messages: prev.messages + count,
        occurrences: prev.occurrences + 1,
      })
    }
  }
  const perMeeting = [...byTitle.entries()]
    .map(([subject, v]) => ({ subject, messages: v.messages, occurrences: v.occurrences }))
    .sort((a, b) => b.messages - a.messages)
  return { total, perMeeting }
}

// Context switches: fixed 15-min bins per day containing >= `threshold`
// distinct conversations.
export function contextSwitching(days, windowMinutes = 15, threshold = 3) {
  const perDay = []
  let total = 0
  for (const d of weekdays(days)) {
    const bins = new Map()
    for (const m of d.messages || []) {
      const bin = Math.floor(minuteOfDay(m.timestamp) / windowMinutes)
      if (!bins.has(bin)) bins.set(bin, new Set())
      bins.get(bin).add(conversationId(m))
    }
    let count = 0
    for (const convs of bins.values()) {
      if (convs.size >= threshold) count++
    }
    perDay.push({ dateKey: d.dateKey, weekday: weekdayName(d.dateKey), count })
    total += count
  }
  return { perDay, total }
}

// The working hour in which the user sent the fewest messages (summed across
// days) — used as a proxy for the quietest incoming hour.
export function quietestHour(days, workingStart, workingEnd) {
  const { hours } = messageVolumeByHour(days, workingStart, workingEnd)
  if (hours.length === 0) return null
  let quietest = hours[0]
  for (const h of hours) {
    if (h.total < quietest.total) quietest = h
  }
  return quietest
}

// Response-speed buckets. A "response event" is a message in a conversation
// that follows a message from a *different* sender (i.e. a reply), bucketed by
// the gap. Pure self-sends with no preceding message from someone else are not
// counted. Returns { sufficient:false } below `minSamples` response events.
export function responsePattern(days, minSamples = 20) {
  const byConv = new Map()
  for (const m of allMessages(days)) {
    const id = conversationId(m)
    if (!byConv.has(id)) byConv.set(id, [])
    byConv.get(id).push(m)
  }

  let immediate = 0
  let considered = 0
  let async = 0
  let samples = 0
  for (const msgs of byConv.values()) {
    const sorted = [...msgs].sort((a, b) => a.timestamp - b.timestamp)
    for (let i = 1; i < sorted.length; i++) {
      // Only count when the sender changes (a reply to someone else).
      if (sorted[i].senderId && sorted[i].senderId === sorted[i - 1].senderId) continue
      const gapMin = (sorted[i].timestamp - sorted[i - 1].timestamp) / 60000
      samples++
      if (gapMin < 5) immediate++
      else if (gapMin <= 30) considered++
      else async++
    }
  }

  if (samples < minSamples) return { sufficient: false }
  const pct = (n) => Math.round((n / samples) * 100)
  return {
    sufficient: true,
    samples,
    immediate: pct(immediate),
    considered: pct(considered),
    async: pct(async),
  }
}

// Teams vs Slack share, plus a "Teams on meeting-heavy days" pattern flag.
export function teamsVsSlack(days) {
  const msgs = allMessages(days)
  const teamsCount = msgs.filter((m) => m.source === 'teams').length
  const slackCount = msgs.filter((m) => m.source === 'slack').length
  const total = teamsCount + slackCount
  const teamsPct = total ? Math.round((teamsCount / total) * 100) : 0
  const slackPct = total ? 100 - teamsPct : 0

  // Pattern: does Teams share rise with meeting load? Compare each day's meeting
  // minutes to its Teams share; require a consistent signal over >= 3 days.
  const dayRows = weekdays(days)
    .map((d) => {
      const dayMsgs = d.messages || []
      const t = dayMsgs.filter((m) => m.source === 'teams').length
      const dtotal = dayMsgs.length
      const meetingMin = (d.events || []).reduce(
        (a, e) => a + Math.max(0, (e.end.getTime() - e.start.getTime()) / 60000),
        0,
      )
      return dtotal > 0 ? { teamsShare: t / dtotal, meetingMin } : null
    })
    .filter(Boolean)

  let patternHolds = false
  if (dayRows.length >= 3) {
    const medMeeting = median(dayRows.map((r) => r.meetingMin))
    const heavy = dayRows.filter((r) => r.meetingMin >= medMeeting)
    const light = dayRows.filter((r) => r.meetingMin < medMeeting)
    if (heavy.length && light.length) {
      patternHolds = avg(heavy.map((r) => r.teamsShare)) > avg(light.map((r) => r.teamsShare))
    }
  }

  return { teamsCount, slackCount, teamsPct, slackPct, patternHolds }
}

function avg(xs) {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0
}
function median(xs) {
  if (!xs.length) return 0
  const s = [...xs].sort((a, b) => a - b)
  const mid = Math.floor(s.length / 2)
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2
}
