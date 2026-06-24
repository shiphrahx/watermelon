// Merge consecutive same-category 30-minute blocks into timeline segments, so
// the day-view timeline shows one labelled band per activity rather than many
// tiny slices. Meeting segments are annotated with the overlapping event title.

import { BLOCK_MINUTES } from './time.js'

// Title of the event overlapping [startMinute, endMinute) on the given day.
function titleForRange(startMinute, endMinute, events, dateKey) {
  if (!events?.length || !dateKey) return null
  const dayStart = new Date(`${dateKey}T00:00:00`).getTime()
  const s = dayStart + startMinute * 60000
  const e = dayStart + endMinute * 60000
  const hit = events.find((ev) => ev.start.getTime() < e && ev.end.getTime() > s)
  return hit ? hit.subject : null
}

export function mergeBlocksIntoSegments(blocks, { events = [], dateKey } = {}) {
  const segments = []
  for (const block of blocks) {
    const last = segments[segments.length - 1]
    if (last && last.category === block.category && last.endMinute === block.startMinute) {
      last.endMinute = block.endMinute
      last.minutes += BLOCK_MINUTES
    } else {
      segments.push({
        category: block.category,
        startMinute: block.startMinute,
        endMinute: block.endMinute,
        minutes: BLOCK_MINUTES,
      })
    }
  }

  // Annotate meeting segments with their event title.
  for (const seg of segments) {
    if (seg.category === 'meeting') {
      seg.title = titleForRange(seg.startMinute, seg.endMinute, events, dateKey)
    }
  }
  return segments
}
