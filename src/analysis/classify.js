// Classification of the working day into 30-minute blocks.
//
// Categories:
//   meeting        — block is covered by an accepted calendar event
//   focus          — no event AND no messages for >= 20 consecutive minutes
//   comms          — no event but messages are present
//   possible-adhoc — no event; message activity stops abruptly for 30+ minutes
//                    then resumes (a likely unscheduled / ad-hoc meeting)
//
// Inputs are already filtered: events exclude declined + all-day; messages are
// a flat list of { timestamp } in ms from Teams and Slack combined.

import { buildDayBlocks, BLOCK_MINUTES, MS_PER_MINUTE } from '../utils/time.js'

export const CATEGORIES = ['meeting', 'focus', 'comms', 'possible-adhoc']

export const CATEGORY_LABELS = {
  meeting: 'Meeting',
  focus: 'Focus',
  comms: 'Comms',
  'possible-adhoc': 'Possible ad-hoc',
}

export const CATEGORY_COLORS = {
  meeting: '#e4572e', // watermelon red
  focus: '#2e8b57', // rind green
  comms: '#f4a259', // amber
  'possible-adhoc': '#7d4f9c', // purple
}

const FOCUS_GAP_MINUTES = 20 // quiet stretch needed to count as focus
const ADHOC_SILENCE_MINUTES = 30 // abrupt silence that may hide an ad-hoc meeting

// Returns true if the time window [start, end) overlaps any event.
function isCoveredByEvent(start, end, events) {
  return events.some((e) => e.start < end && e.end > start)
}

// Returns message timestamps (ms) that fall within [start, end).
function messagesInWindow(start, end, messages) {
  const s = start.getTime()
  const e = end.getTime()
  return messages
    .map((m) => m.timestamp)
    .filter((ts) => ts >= s && ts < e)
    .sort((a, b) => a - b)
}

// Longest gap (minutes) with no messages inside the window, accounting for the
// window edges as implicit boundaries.
function longestQuietGap(start, end, msgTimestamps) {
  const points = [start.getTime(), ...msgTimestamps, end.getTime()]
  let maxGap = 0
  for (let i = 1; i < points.length; i++) {
    const gap = (points[i] - points[i - 1]) / MS_PER_MINUTE
    if (gap > maxGap) maxGap = gap
  }
  return maxGap
}

// Classify a single 30-minute block.
//
// TODO: This is placeholder logic that implements the core rules well enough to
// drive the UI. Refine it: the "possible-adhoc" detection in particular should
// consider cross-block context (silence spanning block boundaries, resumption
// in a later block), per-source weighting (Teams vs Slack), and message volume
// thresholds rather than mere presence. Consider also a confidence score.
function classifyBlock(block, events, messages, allDayMessages) {
  if (isCoveredByEvent(block.start, block.end, events)) {
    return 'meeting'
  }

  const blockMsgs = messagesInWindow(block.start, block.end, messages)

  if (blockMsgs.length === 0) {
    // No messages at all in this block. Check whether this is part of an
    // abrupt silence between two bursts of activity (=> possible ad-hoc),
    // otherwise it is focus time.
    if (isAbruptSilence(block, allDayMessages)) {
      return 'possible-adhoc'
    }
    return 'focus'
  }

  // Messages present. If there is still a long quiet stretch within the block,
  // treat it as focus; otherwise it is comms.
  const quiet = longestQuietGap(block.start, block.end, blockMsgs)
  if (quiet >= FOCUS_GAP_MINUTES) {
    return 'focus'
  }
  return 'comms'
}

// Detect an abrupt silence around a quiet block: activity shortly before the
// block, then 30+ minutes of silence, then activity resuming afterwards.
//
// TODO: tune the look-back / look-forward windows and require a minimum burst
// size on each side rather than a single message.
function isAbruptSilence(block, allDayMessages) {
  const blockStart = block.start.getTime()
  const blockEnd = block.end.getTime()
  const lookWindow = ADHOC_SILENCE_MINUTES * MS_PER_MINUTE

  const before = allDayMessages.some(
    (m) => m.timestamp < blockStart && m.timestamp >= blockStart - lookWindow,
  )
  const after = allDayMessages.some(
    (m) => m.timestamp >= blockEnd && m.timestamp < blockEnd + lookWindow,
  )
  // Silence within the block is implied by the caller (no messages in-block).
  return before && after
}

// Classify a full day. Returns the blocks with an assigned `category`.
export function classifyDay({ dateKey, workingStart, workingEnd, events, messages }) {
  const blocks = buildDayBlocks(dateKey, workingStart, workingEnd)
  return blocks.map((block) => ({
    ...block,
    category: classifyBlock(block, events, messages, messages),
  }))
}

// Aggregate classified blocks (across one or many days) into total minutes per
// category, for the dashboard summary cards.
export function summarise(classifiedBlocks) {
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c, 0]))
  for (const block of classifiedBlocks) {
    totals[block.category] += BLOCK_MINUTES
  }
  return totals
}
