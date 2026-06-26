// Meetings panel — cumulative cost of recurring meetings across history.

import Panel from '../Panel.jsx'
import HoverInfo from '../ui/HoverInfo.jsx'
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
      {/* Visual-first: title + bar at rest; totals/occurrences/avg on hover. */}
      <div className="recurring-list">
        {items.map((m) => (
          <HoverInfo
            as="div"
            className="recurring-row"
            key={m.title}
            content={`${formatDuration(m.totalMinutes)} total · ${m.occurrences} occurrences · ${formatDuration(m.averageMinutes)} avg`}
          >
            <div className="recurring-row__top">
              <span className="recurring-row__title">{m.title}</span>
            </div>
            <div className="ranked-bar">
              <div
                className="ranked-bar__fill"
                style={{ width: `${(m.totalMinutes / max) * 100}%`, backgroundColor: CATEGORY_COLORS.meeting }}
              />
            </div>
          </HoverInfo>
        ))}
      </div>
      {mostExpensive && (
        <p className="highlight-note">
          Most: “{mostExpensive.title}” — {formatDuration(mostExpensive.totalMinutes)}
        </p>
      )}
    </Panel>
  )
}
