// Vertical day-view timeline. Working hours top→bottom, one colour-coded band
// per merged activity segment, with hourly axis labels on the left.

import { CATEGORY_COLORS, CATEGORY_LABELS_SINGULAR } from '../analysis/classify.js'
import { mergeBlocksIntoSegments } from '../utils/segments.js'
import { minutesToTimeLabel, formatDuration, parseTimeToMinutes } from '../utils/time.js'

const PX_PER_MIN = 1.1 // vertical scale

function labelFor(seg) {
  if (seg.category === 'meeting') {
    return seg.title || CATEGORY_LABELS_SINGULAR.meeting
  }
  return `${CATEGORY_LABELS_SINGULAR[seg.category]} — ${formatDuration(seg.minutes)}`
}

export default function DayTimeline({ day, workingStart, workingEnd }) {
  const blocks = day?.blocks || []
  const segments = mergeBlocksIntoSegments(blocks, {
    events: day?.events,
    dateKey: day?.dateKey,
  })

  const startMin = parseTimeToMinutes(workingStart)
  const endMin = parseTimeToMinutes(workingEnd)
  const hourLabels = []
  for (let m = startMin; m <= endMin; m += 60) hourLabels.push(m)

  return (
    <div className="vtimeline-wrap">
      <div className="vtimeline">
        {segments.map((seg, i) => {
          const height = Math.max(22, seg.minutes * PX_PER_MIN)
          const showLabel = height >= 28
          return (
            <div
              key={i}
              className="vtimeline__block"
              style={{ height, backgroundColor: CATEGORY_COLORS[seg.category] }}
              title={`${minutesToTimeLabel(seg.startMinute)}–${minutesToTimeLabel(
                seg.endMinute,
              )} · ${labelFor(seg)}`}
            >
              {i === 0 || segments[i - 1].endMinute !== seg.startMinute ? (
                <span className="vtimeline__axis-label">
                  {minutesToTimeLabel(seg.startMinute)}
                </span>
              ) : null}
              {showLabel && labelFor(seg)}
            </div>
          )
        })}
        {segments.length === 0 && <p className="panel__empty">No activity for this day.</p>}
      </div>
    </div>
  )
}
