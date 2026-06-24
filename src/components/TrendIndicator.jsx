// Small up/down/flat trend chip comparing to the previous equivalent period.

const ARROWS = { up: '▲', down: '▼', flat: '■' }

export default function TrendIndicator({ trend, label = 'vs last week' }) {
  if (!trend) return null
  const { direction, deltaPct } = trend

  let text
  if (deltaPct === null) {
    text = 'new'
  } else if (direction === 'flat') {
    text = 'no change'
  } else {
    text = `${Math.abs(Math.round(deltaPct))}%`
  }

  return (
    <span className={`trend trend--${direction}`}>
      <span aria-hidden="true">{ARROWS[direction]}</span> {text}{' '}
      <span className="muted" style={{ fontWeight: 400 }}>
        {label}
      </span>
    </span>
  )
}
