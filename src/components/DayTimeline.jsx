// Annotated, correctable day timeline. One row per 30-minute block: colour-coded
// by category, hover shows context, and clicking opens a menu to reclassify the
// block. Manually corrected blocks are marked.

import { useState } from 'react'
import {
  CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_LABELS,
  CATEGORY_LABELS_SINGULAR,
  EMPTY_COLOR,
} from '../analysis/classify.js'
import { minutesToTimeLabel, formatDuration } from '../utils/time.js'

function eventTitleAt(block, events = []) {
  const hit = (events || []).find(
    (e) => e.start.getTime() < block.end.getTime() && e.end.getTime() > block.start.getTime(),
  )
  return hit ? hit.subject : null
}

function messageCountAt(block, messages = []) {
  const s = block.start.getTime()
  const e = block.end.getTime()
  return (messages || []).filter((m) => m.timestamp >= s && m.timestamp < e).length
}

function labelFor(block, title) {
  if (block.category === 'meeting') return title || CATEGORY_LABELS_SINGULAR.meeting
  return CATEGORY_LABELS_SINGULAR[block.category] || 'Unscheduled'
}

function contextFor(block, title, msgCount) {
  if (block.category === 'meeting') return title || 'Meeting'
  if (block.category === 'comms' || block.category === 'shallow') {
    return `${msgCount} message${msgCount === 1 ? '' : 's'}`
  }
  return 'no activity'
}

export default function DayTimeline({ day, onCorrect }) {
  const [menuFor, setMenuFor] = useState(null)
  const blocks = day?.blocks || []

  if (blocks.length === 0) {
    return <p className="panel__empty">No activity for this day.</p>
  }

  return (
    <div className="vtimeline2">
      {blocks.map((block) => {
        const title = eventTitleAt(block, day.events)
        const msgCount = messageCountAt(block, day.messages)
        const color = CATEGORY_COLORS[block.category] || EMPTY_COLOR
        const onHour = block.startMinute % 60 === 0
        const open = menuFor === block.startMinute
        return (
          <div className="vtimeline2__row" key={block.startMinute}>
            <span className="vtimeline2__axis">
              {onHour ? minutesToTimeLabel(block.startMinute) : ''}
            </span>
            <button
              type="button"
              className={`vtimeline2__block${block.corrected ? ' is-corrected' : ''}`}
              style={{ backgroundColor: color }}
              title={`${minutesToTimeLabel(block.startMinute)}–${minutesToTimeLabel(
                block.endMinute,
              )} · ${labelFor(block, title)} · ${contextFor(block, title, msgCount)} · ${formatDuration(30)}`}
              onClick={() => setMenuFor(open ? null : block.startMinute)}
            >
              <span className="vtimeline2__label">{labelFor(block, title)}</span>
              {block.corrected && <span className="vtimeline2__mark" aria-label="manually adjusted">✎</span>}
            </button>
            {open && (
              <div className="vtimeline2__menu" role="menu">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      onCorrect?.(block.startMinute, cat)
                      setMenuFor(null)
                    }}
                  >
                    <span className="legend__swatch" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                    {CATEGORY_LABELS[cat]}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
