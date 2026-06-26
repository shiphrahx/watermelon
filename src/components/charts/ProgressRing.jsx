// Circular progress ring (Recharts radial bar) with centred content.

import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from 'recharts'

export default function ProgressRing({ pct = 0, color = '#4CAF82', size = 132, children }) {
  const data = [{ value: Math.max(0, Math.min(100, pct)) }]
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          innerRadius="74%"
          outerRadius="100%"
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
          <RadialBar dataKey="value" cornerRadius={12} fill={color} background={{ fill: '#eef0f2' }} />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="ring__center">{children}</div>
    </div>
  )
}
