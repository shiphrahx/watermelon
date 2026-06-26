// Meetings panel — cumulative cost of recurring meetings across history.

import Panel from '../Panel.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'
import { formatDuration } from '../../utils/time.js'

export default function RecurringMeetingCost({ audit }) {
  const { items = [], mostExpensive } = audit || {}
  const max = Math.max(1, ...items.map((m) => m.totalMinutes))

  return (
    <Panel
      title="Recurring meeting cost"
      hint="Cumulative time in meetings that recur, across your history"
      isEmpty={items.length === 0}
      emptyMessage="No recurring meetings found yet."
    >
      <div className="recurring-list">
        {items.map((m) => (
          <div className="recurring-row" key={m.title}>
            <div className="recurring-row__top">
              <span className="recurring-row__title" title={m.title}>
                {m.title}
              </span>
              <span className="recurring-row__meta">
                {formatDuration(m.totalMinutes)} · {m.occurrences}× · {formatDuration(m.averageMinutes)} avg
              </span>
            </div>
            <div className="ranked-bar">
              <div
                className="ranked-bar__fill"
                style={{ width: `${(m.totalMinutes / max) * 100}%`, backgroundColor: CATEGORY_COLORS.meeting }}
              />
            </div>
          </div>
        ))}
      </div>
      {mostExpensive && (
        <p className="highlight-note">
          You've spent {formatDuration(mostExpensive.totalMinutes)} in “{mostExpensive.title}”. Worth a
          look?
        </p>
      )}
    </Panel>
  )
}
