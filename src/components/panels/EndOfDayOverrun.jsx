// Overview panel — how many days ran past the working-day end, with a per-day
// bar of how far past (capped at 60 min for display).

import Panel from '../Panel.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'
import { formatDuration } from '../../utils/time.js'

export default function EndOfDayOverrun({ overrun, workingEnd }) {
  const { perDay = [], daysOver = 0, totalDays = 0 } = overrun || {}
  // Only days that actually ran over are shown as rows — no empty bars/dashes.
  const overrunDays = perDay.filter((d) => d.overrunMinutes > 0)
  const period = totalDays > 5 ? 'period' : 'week'
  const headline =
    daysOver === 0
      ? `You stayed within your working hours every day this ${period}.`
      : `You went past ${workingEnd} on ${daysOver} of ${totalDays} days this ${period}.`

  return (
    <Panel title="End-of-day overrun" isEmpty={totalDays === 0} emptyMessage="No working days in this period.">
      <p className="headline-explain" style={{ marginTop: 0 }}>{headline}</p>
      {overrunDays.length > 0 && (
        <div className="hbar-list">
          {overrunDays.map((d) => (
            <div className="hbar-row" key={d.dateKey}>
              <span className="hbar-row__label">{d.weekday}</span>
              <div className="hbar-track" title={`${d.weekday} · ${formatDuration(d.overrunMinutes)} past ${workingEnd}`}>
                <div
                  className="hbar-fill"
                  style={{ width: `${(d.displayMinutes / 60) * 100}%`, backgroundColor: CATEGORY_COLORS.messaging }}
                />
              </div>
              <span className="hbar-row__value">+{formatDuration(d.overrunMinutes)}</span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  )
}
