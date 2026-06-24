// Overview panel — focus-rate sparkline across the days in range, with the
// highest and lowest points labelled. No axes, just the line + two labels.

import Panel from '../Panel.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'

const W = 280
const H = 60
const PAD = 6

function points(rows) {
  if (rows.length === 0) return []
  const max = Math.max(100, ...rows.map((r) => r.focusRate))
  const min = 0
  const span = max - min || 1
  const step = rows.length > 1 ? (W - PAD * 2) / (rows.length - 1) : 0
  return rows.map((r, i) => ({
    x: PAD + i * step,
    y: H - PAD - ((r.focusRate - min) / span) * (H - PAD * 2),
    row: r,
  }))
}

export default function FocusRateTrend({ trend }) {
  const rows = trend?.rows || []
  const pts = points(rows)
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')

  return (
    <Panel
      title="Focus rate trend"
      isEmpty={rows.length === 0}
      emptyMessage="No focus data for this period."
    >
      <svg className="sparkline" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" role="img" aria-label="Focus rate per day">
        {pts.length > 1 && (
          <path d={path} fill="none" stroke={CATEGORY_COLORS.focus} strokeWidth="2" />
        )}
        {pts.map((p) => (
          <circle key={p.row.dateKey} cx={p.x} cy={p.y} r="3" fill={CATEGORY_COLORS.focus}>
            <title>{`${p.row.weekday} · ${Math.round(p.row.focusRate)}% focus`}</title>
          </circle>
        ))}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        {trend?.high && (
          <span className="spark-label">High: {trend.high.weekday} {Math.round(trend.high.focusRate)}%</span>
        )}
        {trend?.low && (
          <span className="spark-label">Low: {trend.low.weekday} {Math.round(trend.low.focusRate)}%</span>
        )}
      </div>
    </Panel>
  )
}
