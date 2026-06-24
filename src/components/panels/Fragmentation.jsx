// Meetings panel — meeting fragmentation: unusable short gaps per day.

import Panel from '../Panel.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'
import { formatDuration } from '../../utils/time.js'

export default function Fragmentation({ fragmentation }) {
  const { perDay = [], totalLostMinutes = 0 } = fragmentation || {}
  const maxCount = Math.max(1, ...perDay.map((d) => d.count))
  return (
    <Panel
      title="Meeting fragmentation"
      hint="Gaps between meetings too short to use (under 20 min)"
      isEmpty={perDay.length === 0}
      emptyMessage="No meetings found for this period."
    >
      <div className="hbar-list">
        {perDay.map((d) => (
          <div className="hbar-row" key={d.dateKey}>
            <span className="hbar-row__label">{d.weekday}</span>
            <div className="hbar-track" title={`${d.weekday} · ${d.count} unusable gaps · ${formatDuration(d.lostMinutes)} lost`}>
              <div
                className="hbar-fill"
                style={{ width: `${(d.count / maxCount) * 100}%`, backgroundColor: CATEGORY_COLORS.meetings }}
              />
            </div>
            <span className="hbar-row__value">
              {d.count} {d.count === 1 ? 'gap' : 'gaps'} ({formatDuration(d.lostMinutes)})
            </span>
          </div>
        ))}
      </div>
      <p className="highlight-note">
        You lost {formatDuration(totalLostMinutes)} this week to gaps too short to use.
      </p>
    </Panel>
  )
}
