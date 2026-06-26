// Polished trend chart (Recharts): gradient area for a single series, or
// multiple smooth lines, with axes, legend, tooltip and an optional goal line.

import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'

export default function TrendChart({
  data = [],
  series = [],
  yUnit = '',
  yDomain,
  referenceLine = null,
  height = 220,
}) {
  const single = series.length === 1
  const axis = { stroke: '#9aa3ad', fontSize: 11 }
  const tooltip = {
    contentStyle: { borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 },
    formatter: (v, name) => [`${v}${yUnit}`, name],
  }

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {single ? (
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
            <defs>
              <linearGradient id={`grad-${series[0].key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={series[0].color} stopOpacity={0.35} />
                <stop offset="100%" stopColor={series[0].color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} {...axis} />
            <YAxis domain={yDomain} tickLine={false} axisLine={false} width={36} {...axis} />
            <Tooltip {...tooltip} />
            {referenceLine && (
              <ReferenceLine
                y={referenceLine.value}
                stroke="#e4572e"
                strokeDasharray="4 3"
                label={{ value: referenceLine.label, position: 'insideTopRight', fontSize: 10, fill: '#e4572e' }}
              />
            )}
            <Area
              type="monotone"
              dataKey={series[0].key}
              name={series[0].label}
              stroke={series[0].color}
              strokeWidth={2.5}
              fill={`url(#grad-${series[0].key})`}
              dot={{ r: 2.5, strokeWidth: 0, fill: series[0].color }}
              activeDot={{ r: 4 }}
            />
          </AreaChart>
        ) : (
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 4, left: -8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} {...axis} />
            <YAxis domain={yDomain} tickLine={false} axisLine={false} width={36} {...axis} />
            <Tooltip {...tooltip} />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            {referenceLine && (
              <ReferenceLine
                y={referenceLine.value}
                stroke="#e4572e"
                strokeDasharray="4 3"
                label={{ value: referenceLine.label, position: 'insideTopRight', fontSize: 10, fill: '#e4572e' }}
              />
            )}
            {series.map((s) => (
              <Line
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={2.5}
                dot={{ r: 2.5, strokeWidth: 0, fill: s.color }}
                activeDot={{ r: 4 }}
              />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  )
}
