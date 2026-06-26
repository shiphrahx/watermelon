// KPI card: icon badge, muted label, hero number, small coloured delta with a
// directional arrow, and an optional corner sparkline.

const ARROWS = { up: '↑', down: '↓', flat: '→' }

function Delta({ trend, good }) {
  if (!trend) return null
  const { direction, deltaPct } = trend
  // colour reflects good/bad; arrow reflects actual direction
  const tone = direction === 'flat' ? 'flat' : good ? 'up' : 'down'
  const text = deltaPct == null ? 'new' : direction === 'flat' ? 'no change' : `${Math.abs(Math.round(deltaPct))}%`
  return (
    <span className={`kpi__delta kpi__delta--${tone}`}>
      <span aria-hidden="true">{ARROWS[direction]}</span> {text}
      <span className="kpi__delta-cap"> vs last week</span>
    </span>
  )
}

export default function KpiCard({ icon, label, value, small, trend, deltaGood = true, spark }) {
  return (
    <div className="uicard kpi">
      {icon && <span className="kpi__badge" aria-hidden="true">{icon}</span>}
      <span className="kpi__label">{label}</span>
      <span className={`kpi__value${small ? ' kpi__value--sm' : ''}`}>{value}</span>
      {trend && <Delta trend={trend} good={deltaGood} />}
      {spark && <div className="kpi__spark">{spark}</div>}
    </div>
  )
}
