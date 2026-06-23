// Visual timeline for a single day: one colour-coded segment per 30-minute
// block, with the working-hours axis labelled.

import { CATEGORY_LABELS, CATEGORY_COLORS } from '../analysis/classify.js'
import { minutesToTimeLabel } from '../utils/time.js'

export default function Timeline({ dateKey, blocks }) {
  const prettyDate = new Date(dateKey + 'T00:00:00').toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="timeline-row">
      <div className="timeline-row__date">{prettyDate}</div>
      <div className="timeline-track">
        {blocks.map((block, i) => (
          <div
            key={i}
            className="timeline-block"
            title={`${minutesToTimeLabel(block.startMinute)}–${minutesToTimeLabel(
              block.endMinute,
            )} · ${CATEGORY_LABELS[block.category]}`}
            style={{ backgroundColor: CATEGORY_COLORS[block.category] }}
          />
        ))}
      </div>
      {blocks.length > 0 && (
        <div className="timeline-axis">
          <span>{minutesToTimeLabel(blocks[0].startMinute)}</span>
          <span>{minutesToTimeLabel(blocks[blocks.length - 1].endMinute)}</span>
        </div>
      )}
    </div>
  )
}
