// Focus panel — how focus time is structured by block size. Sub-20-min blocks
// are shown for transparency but flagged as not counted toward focus time; the
// "deep blocks" bucket is highlighted as the most valuable.

import Panel from '../Panel.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'
import { formatDuration } from '../../utils/time.js'

const ROW_LABELS = {
  under20: 'Under 20 min — not counted',
  '20to30': '20–30 min — short blocks',
  '30to60': '30–60 min — medium blocks',
  over60: 'Over 60 min — deep blocks',
}
const UNDER20_TOOLTIP = "Blocks under 20 minutes don't meet the minimum threshold for deep focus"

export default function FocusBlockDistribution({ distribution }) {
  const { buckets = [], totalMinutes = 0, totalBlocks = 0, averageMinutes = 0 } = distribution || {}
  const maxCount = Math.max(1, ...buckets.map((b) => b.count))

  return (
    <Panel
      title="How your focus time is structured"
      hint="Focus time in long uninterrupted blocks is more valuable than the same hours fragmented into short gaps."
      isEmpty={totalBlocks === 0}
      emptyMessage="No focus blocks detected — try a wider date range."
    >
      <div className="hbar-list">
        {buckets.map((b) => {
          const isDeep = b.key === 'over60'
          const isUnder20 = b.key === 'under20'
          return (
            <div key={b.key} className={`hbar-row${isDeep ? ' hbar-row--best' : ''}`}>
              <span
                className="hbar-row__label"
                style={isUnder20 ? { color: 'var(--color-empty)' } : undefined}
                title={isUnder20 ? UNDER20_TOOLTIP : undefined}
              >
                {ROW_LABELS[b.key] || b.label}
              </span>
              <div className="hbar-track" title={`${b.count} blocks`}>
                <div
                  className="hbar-fill"
                  style={{
                    width: `${(b.count / maxCount) * 100}%`,
                    backgroundColor: b.counted ? CATEGORY_COLORS.focus : '#cfcfcf',
                    opacity: b.counted ? 1 : 0.5,
                  }}
                />
              </div>
              <span className="hbar-row__value">
                {b.count} {b.count === 1 ? 'block' : 'blocks'}
                {b.counted ? ` · ${formatDuration(b.minutes)}` : ' · not counted'}
              </span>
            </div>
          )
        })}
      </div>
      <p className="highlight-note">
        Your {formatDuration(totalMinutes)} of focus came in {totalBlocks}{' '}
        {totalBlocks === 1 ? 'block' : 'blocks'}, averaging {averageMinutes} minutes each.
      </p>
    </Panel>
  )
}
