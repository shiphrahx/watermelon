// Classification of the working day.
//
// Each minute of the working day is classified, then aggregated into 30-minute
// blocks (the engine's output unit). Categories, in priority order:
//
//   meeting  — an accepted, non-all-day calendar event covers the minute
//   comms    — "Responding & messaging": active messaging, i.e. no gap longer
//              than 5 minutes between consecutive sent messages
//   shallow  — "Shallow work": a gap of 5–20 minutes between sent messages
//   focus    — "Deep focus": a silent stretch of 20+ minutes with low message
//              density (< 5 messaging minutes per 30-minute window)
//   (unclassified) — anything else (e.g. a <20-min gap between meetings); it is
//              excluded from all totals and is NOT part of CATEGORIES.
//
// Inputs are already filtered by normalization: events exclude declined +
// all-day (tentative kept); messages are { timestamp } in ms.

import { buildDayBlocks, BLOCK_MINUTES, fromDateKey, parseTimeToMinutes } from '../utils/time.js'

// Active categories shown in totals, legends and charts.
export const CATEGORIES = ['meeting', 'focus', 'comms', 'shallow']

// Minutes that match no rule. Tracked per block but excluded from CATEGORIES.
export const UNCLASSIFIED = 'unclassified'

export const CATEGORY_LABELS = {
  meeting: 'In meetings',
  focus: 'Deep focus',
  comms: 'Responding & messaging',
  shallow: 'Shallow work',
}

export const CATEGORY_LABELS_SINGULAR = {
  meeting: 'In meeting',
  focus: 'Deep focus',
  comms: 'Responding & messaging',
  shallow: 'Shallow work',
}

export const CATEGORY_DESCRIPTIONS = {
  meeting: 'Time covered by a calendar event you accepted',
  focus: 'A silent stretch of 20+ minutes with little or no messaging',
  comms: 'Active messaging — replies with gaps of 5 minutes or less',
  shallow: 'Between messaging and focus — a 5–20 minute pause (reviewing, reading, small tasks)',
}

// Calm palette. Mirrored as CSS variables in index.css.
export const CATEGORY_COLORS = {
  meeting: '#5B8DEF', // blue
  focus: '#4CAF82', // green
  comms: '#F5A623', // amber
  shallow: '#A8C5E8', // muted blue
}

export const EMPTY_COLOR = '#E0E0E0'

// Thresholds (minutes).
const MESSAGING_MAX_GAP = 5 // active messaging: consecutive gaps <= this
const SHALLOW_MAX_GAP = 20 // 5 < gap <= 20 => shallow work
const FOCUS_MIN_LENGTH = 20 // a focus block must be at least this long

// True if any event covers the minute window [tStart, tEnd).
function minuteHasMeeting(tStart, tEnd, events) {
  return events.some((e) => e.start.getTime() < tEnd && e.end.getTime() > tStart)
}

// Group sorted messaging-minute offsets into chains where consecutive messages
// are <= MESSAGING_MAX_GAP apart.
function buildChains(msgMinutes) {
  const chains = []
  for (const m of msgMinutes) {
    const last = chains[chains.length - 1]
    if (last && m - last.end <= MESSAGING_MAX_GAP) {
      last.end = m
    } else {
      chains.push({ start: m, end: m })
    }
  }
  return chains
}

// Classify every minute of the working day into a category (or UNCLASSIFIED).
function classifyMinutes(dateKey, startMin, endMin, events, messages) {
  const span = endMin - startMin
  const minutes = new Array(span).fill(UNCLASSIFIED)
  const dayStartMs = fromDateKey(dateKey).getTime()

  // Messaging minutes (a minute holding >= 1 message) within working hours.
  const msgSet = new Set()
  for (const msg of messages) {
    const offset = Math.floor((msg.timestamp - dayStartMs) / 60000)
    if (offset >= startMin && offset < endMin) msgSet.add(offset)
  }
  const msgMinutes = [...msgSet].sort((a, b) => a - b)
  const chains = buildChains(msgMinutes)

  const idx = (m) => m - startMin
  const setRange = (from, to, category) => {
    for (let m = Math.max(from, startMin); m <= Math.min(to, endMin - 1); m++) {
      minutes[idx(m)] = category
    }
  }

  // Silent run [from, to] with no messages -> focus if long enough, else dead.
  const fillSilence = (from, to) => {
    if (to < from) return
    const length = to - from + 1
    setRange(from, to, length >= FOCUS_MIN_LENGTH ? 'focus' : UNCLASSIFIED)
  }

  if (chains.length === 0) {
    fillSilence(startMin, endMin - 1)
  } else {
    // Silence before the first chain.
    fillSilence(startMin, chains[0].start - 1)
    // Each chain's span is active messaging.
    for (const c of chains) setRange(c.start, c.end, 'comms')
    // Gaps between chains.
    for (let i = 1; i < chains.length; i++) {
      const gapStart = chains[i - 1].end + 1
      const gapEnd = chains[i].start - 1
      const gapLen = chains[i].start - chains[i - 1].end // distance between messages
      if (gapEnd < gapStart) continue
      if (gapLen <= SHALLOW_MAX_GAP) {
        setRange(gapStart, gapEnd, 'shallow') // 5 < gapLen <= 20
      } else {
        fillSilence(gapStart, gapEnd) // gapLen > 20
      }
    }
    // Silence after the last chain.
    fillSilence(chains[chains.length - 1].end + 1, endMin - 1)
  }

  // Meeting overrides everything (highest priority).
  for (let m = startMin; m < endMin; m++) {
    const tStart = dayStartMs + m * 60000
    if (minuteHasMeeting(tStart, tStart + 60000, events)) minutes[idx(m)] = 'meeting'
  }

  // Post-pass: a focus run broken below the minimum length — e.g. a short gap
  // between two meetings — is unclassified dead time, not deep focus.
  for (let i = 0; i < minutes.length; ) {
    if (minutes[i] === 'focus') {
      let j = i
      while (j < minutes.length && minutes[j] === 'focus') j++
      if (j - i < FOCUS_MIN_LENGTH) {
        for (let k = i; k < j; k++) minutes[k] = UNCLASSIFIED
      }
      i = j
    } else {
      i++
    }
  }

  return minutes
}

// Priority used to break ties when a 30-minute block spans multiple categories.
const PRIORITY = ['meeting', 'comms', 'shallow', 'focus', UNCLASSIFIED]

// Classify a full day into 30-minute blocks with an assigned `category`.
export function classifyDay({ dateKey, workingStart, workingEnd, events, messages }) {
  const startMin = parseTimeToMinutes(workingStart)
  const endMin = parseTimeToMinutes(workingEnd)
  const minutes = classifyMinutes(dateKey, startMin, endMin, events, messages)
  const blocks = buildDayBlocks(dateKey, workingStart, workingEnd)

  return blocks.map((block) => {
    const counts = {}
    for (let m = block.startMinute; m < block.endMinute; m++) {
      const cat = minutes[m - startMin]
      counts[cat] = (counts[cat] || 0) + 1
    }
    let best = UNCLASSIFIED
    let bestCount = -1
    for (const cat of PRIORITY) {
      const c = counts[cat] || 0
      if (c > bestCount) {
        best = cat
        bestCount = c
      }
    }
    return { ...block, category: best }
  })
}

// Aggregate classified blocks into total minutes per active category. Blocks
// that are UNCLASSIFIED are excluded from all totals.
export function summarise(classifiedBlocks) {
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c, 0]))
  for (const block of classifiedBlocks) {
    if (block.category in totals) totals[block.category] += BLOCK_MINUTES
  }
  return totals
}
