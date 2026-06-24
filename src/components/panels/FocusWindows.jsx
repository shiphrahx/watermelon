// Panel 2 — Best focus windows: average focus time per 1-hour slot, ordered by
// time of day, highlighting the strongest slot.

import Panel from '../Panel.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'
import { formatDuration } from '../../utils/time.js'

export default function FocusWindows({ focusWindows }) {
  const slots = focusWindows?.slots || []
  const top = focusWindows?.top
  const max = Math.max(1, ...slots.map((s) => s.avgFocusMinutes))
  const isEmpty = !top

  return (
    <Panel
      title="Best focus windows"
      hint="When in the day you focus best"
      isEmpty={isEmpty}
      emptyMessage="No focus blocks detected — try a longer date range."
    >
      <div className="hbar-list">
        {slots.map((s) => {
          const isBest = top && s.startMinute === top.startMinute
          return (
            <div key={s.startMinute} className={`hbar-row${isBest ? ' hbar-row--best' : ''}`}>
              <span className="hbar-row__label">{s.label}</span>
              <div className="hbar-track">
                <div
                  className="hbar-fill"
                  style={{
                    width: `${(s.avgFocusMinutes / max) * 100}%`,
                    backgroundColor: CATEGORY_COLORS.focus,
                  }}
                />
              </div>
              <span className="hbar-row__value">
                {s.avgFocusMinutes > 0 ? formatDuration(Math.round(s.avgFocusMinutes)) : '—'}
              </span>
            </div>
          )
        })}
      </div>
      {top && (
        <p className="highlight-note">Your best focus window is {top.label}</p>
      )}
    </Panel>
  )
}
