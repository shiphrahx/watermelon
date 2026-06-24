// Panel 4 — Focus time by day: total deep-focus hours per day, highlighting the
// best focus day. Clicking a bar navigates to that day's view.

import Panel from '../Panel.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'
import { formatDuration } from '../../utils/time.js'

export default function FocusByDay({ focusByDay, onSelectDay }) {
  const bars = focusByDay?.bars || []
  const best = focusByDay?.best
  const max = Math.max(1, ...bars.map((b) => b.focusMinutes))
  const isEmpty = bars.length === 0 || bars.every((b) => b.focusMinutes === 0)

  return (
    <Panel
      title="Focus time by day"
      hint="Spot patterns across the week"
      isEmpty={isEmpty}
      emptyMessage="No focus blocks detected — try a longer date range."
    >
      <div className="hbar-list">
        {bars.map((b) => {
          const isBest = best && b.dateKey === best.dateKey
          return (
            <div key={b.dateKey} className={`hbar-row${isBest ? ' hbar-row--best' : ''}`}>
              <span className="hbar-row__label">
                {onSelectDay ? (
                  <button onClick={() => onSelectDay(b.dateKey)}>{b.weekday}</button>
                ) : (
                  b.weekday
                )}
              </span>
              <div className="hbar-track">
                <div
                  className="hbar-fill"
                  style={{
                    width: `${(b.focusMinutes / max) * 100}%`,
                    backgroundColor: CATEGORY_COLORS.focus,
                  }}
                />
              </div>
              <span className="hbar-row__value">
                {b.focusMinutes > 0 ? formatDuration(b.focusMinutes) : '—'}
              </span>
            </div>
          )
        })}
      </div>
      {best && <p className="highlight-note">Best focus day: {best.weekday}</p>}
    </Panel>
  )
}
