// Small dependency-free SVG multi-line chart with labelled axes, a legend, and
// per-point tooltips. Optionally draws a horizontal reference line (e.g. a goal).

const W = 360
const H = 200
const PAD_L = 38
const PAD_B = 28
const PAD_T = 10
const PAD_R = 10

function shortWeek(weekKey) {
  const wk = String(weekKey).split('-W')[1]
  return wk ? `W${wk}` : weekKey
}

export default function MultiLineChart({
  weekKeys = [],
  lines = [],
  yLabel = '',
  yMax,
  yUnit = '',
  referenceLine = null,
}) {
  const n = weekKeys.length
  const allValues = lines.flatMap((l) => l.values).concat(referenceLine ? [referenceLine.value] : [])
  const max = yMax ?? Math.max(1, ...allValues) * 1.1
  const plotW = W - PAD_L - PAD_R
  const plotH = H - PAD_T - PAD_B

  const x = (i) => PAD_L + (n <= 1 ? plotW / 2 : (i / (n - 1)) * plotW)
  const y = (v) => PAD_T + plotH - (v / max) * plotH

  const yticks = [0, max / 2, max]

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={yLabel} className="chart__svg">
        {/* Y axis + gridlines + labels */}
        {yticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD_L} y1={y(t)} x2={W - PAD_R} y2={y(t)} className="chart__grid" />
            <text x={PAD_L - 5} y={y(t) + 3} textAnchor="end" className="chart__tick">
              {Math.round(t)}
            </text>
          </g>
        ))}
        {/* Axis lines */}
        <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={PAD_T + plotH} className="chart__axis" />
        <line x1={PAD_L} y1={PAD_T + plotH} x2={W - PAD_R} y2={PAD_T + plotH} className="chart__axis" />

        {/* X labels (every other when crowded) */}
        {weekKeys.map((wk, i) => (
          <text
            key={wk}
            x={x(i)}
            y={H - 8}
            textAnchor="middle"
            className="chart__tick"
            style={{ display: n > 6 && i % 2 ? 'none' : undefined }}
          >
            {shortWeek(wk)}
          </text>
        ))}

        {/* Reference line (e.g. goal) */}
        {referenceLine && (
          <g>
            <line
              x1={PAD_L}
              y1={y(referenceLine.value)}
              x2={W - PAD_R}
              y2={y(referenceLine.value)}
              className="chart__ref"
            />
            <text x={W - PAD_R} y={y(referenceLine.value) - 3} textAnchor="end" className="chart__tick">
              {referenceLine.label}
            </text>
          </g>
        )}

        {/* Lines + points */}
        {lines.map((line) => (
          <g key={line.key}>
            <path
              d={line.values
                .map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
                .join(' ')}
              fill="none"
              stroke={line.color}
              strokeWidth="2"
            />
            {line.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r="3" fill={line.color}>
                <title>{`${shortWeek(weekKeys[i])} · ${line.label}: ${v}${yUnit}`}</title>
              </circle>
            ))}
          </g>
        ))}

        {/* Y axis label */}
        <text
          transform={`translate(10 ${PAD_T + plotH / 2}) rotate(-90)`}
          textAnchor="middle"
          className="chart__axis-label"
        >
          {yLabel}
        </text>
      </svg>

      {/* Legend */}
      <div className="chart__legend">
        {lines.map((l) => (
          <span key={l.key} className="legend__item">
            <span className="legend__swatch" style={{ backgroundColor: l.color }} />
            {l.label}
          </span>
        ))}
        {referenceLine && (
          <span className="legend__item">
            <span className="legend__swatch chart__ref-swatch" />
            {referenceLine.label}
          </span>
        )}
      </div>
    </div>
  )
}
