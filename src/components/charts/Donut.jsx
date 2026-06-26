// Donut breakdown with a centre stat and a compact legend. Built on Recharts.
// The legend is plain DOM (not inside the SVG) so it stays readable and testable.

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export default function Donut({ data = [], height = 170, centerValue, centerLabel }) {
  const nonZero = data.filter((d) => d.value > 0)

  return (
    <div className="donut2">
      <div className="donut2__chart" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={nonZero.length ? nonZero : [{ key: 'empty', label: 'No data', value: 1, color: '#E0E0E0' }]}
              dataKey="value"
              nameKey="label"
              innerRadius="64%"
              outerRadius="92%"
              paddingAngle={nonZero.length > 1 ? 2 : 0}
              stroke="none"
            >
              {(nonZero.length ? nonZero : [{ color: '#E0E0E0' }]).map((d, i) => (
                <Cell key={d.key || i} fill={d.color} />
              ))}
            </Pie>
            {nonZero.length > 0 && (
              <Tooltip
                formatter={(value, name, entry) => [entry?.payload?.display ?? value, name]}
                separator=": "
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        {centerValue != null && (
          <div className="donut2__center">
            <div className="donut2__value">{centerValue}</div>
            {centerLabel && <div className="donut2__label">{centerLabel}</div>}
          </div>
        )}
      </div>
      <ul className="donut2__legend">
        {data.map((d) => (
          <li key={d.key}>
            <span className="legend__swatch" style={{ backgroundColor: d.color }} />
            <span className="donut2__legend-label">{d.label}</span>
            <span className="donut2__legend-val">{d.display}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
