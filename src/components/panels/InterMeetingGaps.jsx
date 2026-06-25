// Meetings panel — distribution of gaps between accepted meetings, bucketed by
// usefulness. Leads with the distribution (no misleading average); the
// "Too short to use" bucket is highlighted in amber.

import Panel from '../Panel.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'
import { formatDuration } from '../../utils/time.js'

export default function InterMeetingGaps({ gaps }) {
  const { buckets = [], totalGaps = 0, tooShortCount = 0, tooShortMinutes = 0 } = gaps || {}
  const maxCount = Math.max(1, ...buckets.map((b) => b.count))

  return (
    <Panel
      title="Inter-meeting gaps"
      hint="Gaps between your accepted meetings, by how usable they are"
      isEmpty={totalGaps === 0}
      emptyMessage="No gaps between meetings this period."
    >
      <div className="hbar-list">
        {buckets.map((b) => {
          const isTooShort = b.key === 'tooShort'
          return (
            <div className="hbar-row" key={b.key}>
              <span className="hbar-row__label">{b.label}</span>
              <div className="hbar-track" title={`${b.label} · ${b.count} gaps · ${formatDuration(b.minutes)}`}>
                <div
                  className="hbar-fill"
                  style={{
                    width: `${(b.count / maxCount) * 100}%`,
                    backgroundColor: isTooShort ? CATEGORY_COLORS.messaging : CATEGORY_COLORS.meetings,
                  }}
                />
              </div>
              <span className="hbar-row__value">
                {b.count} {b.count === 1 ? 'gap' : 'gaps'} · {formatDuration(b.minutes)}
              </span>
            </div>
          )
        })}
      </div>
      <p className="highlight-note" style={{ color: CATEGORY_COLORS.messaging }}>
        {tooShortCount} {tooShortCount === 1 ? 'gap was' : 'gaps were'} too short to use, costing you{' '}
        {formatDuration(tooShortMinutes)} of recoverable time.
      </p>
    </Panel>
  )
}
