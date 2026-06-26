// Tiny inline sparkline: greyscale line with the last point in accent.

export default function MiniSparkline({ values = [], color = 'var(--accent)', width = 64, height = 24 }) {
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const step = width / (values.length - 1)
  const pts = values.map((v, i) => [i * step, height - ((v - min) / span) * (height - 4) - 2])
  const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <path d={d} fill="none" stroke="var(--color-empty)" strokeWidth="1.5" />
      <circle cx={lx} cy={ly} r="2.5" fill={color} />
    </svg>
  )
}
