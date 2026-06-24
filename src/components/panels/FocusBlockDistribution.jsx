// Focus panel — distribution of focus time by block size. Sub-20-min blocks are
// shown for transparency but flagged as not counted toward focus time.

import Panel from '../Panel.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'
import { formatDuration } from '../../utils/time.js'

export default function FocusBlockDistribution({ distribution }) {
  const { buckets = [], totalMinutes = 0, totalBlocks = 0, averageMinutes = 0 } = distribution || {}
  const maxCount = Math.max(1, ...buckets.map((b) => b.count))

  return (
    <Panel
      title="Focus block size distribution"
      hint="Two people with the same focus hours can have very different days"
      isEmpty={totalBlocks === 0}
      emptyMessage="No focus blocks detected — try a wider date range."
    >
      <div className="hbar-list">
        {buckets.map((b) => (
          <div className="hbar-row" key={b.key}>
            <span className="hbar-row__label">{b.label}</span>
            <div className="hbar-track" title={`${b.label} · ${b.count} blocks`}>
              <div
                className="hbar-fill"
                style={{
                  width: `${(b.count / maxCount) * 100}%`,
                  backgroundColor: b.counted ? CATEGORY_COLORS.focus : CATEGORY_COLORS.empty || '#cfcfcf',
                  opacity: b.counted ? 1 : 0.5,
                }}
              />
            </div>
            <span className="hbar-row__value">
              {b.count} {b.count === 1 ? 'block' : 'blocks'}
              {b.counted ? ` · ${formatDuration(b.minutes)}` : ' · not counted'}
            </span>
          </div>
        ))}
      </div>
      <p className="highlight-note">
        Your {formatDuration(totalMinutes)} of focus came in {totalBlocks}{' '}
        {totalBlocks === 1 ? 'block' : 'blocks'}, averaging {averageMinutes} minutes each.
      </p>
    </Panel>
  )
}
