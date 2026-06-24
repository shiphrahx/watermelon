// Reusable horizontal bar chart. Each row: { key, label, value, fillRatio
// (0..1), color, bold, onClick, title }. Keeps every bar panel consistent.

export default function HBarChart({ rows }) {
  return (
    <div className="hbar-list">
      {rows.map((r) => (
        <div key={r.key} className={`hbar-row${r.bold ? ' hbar-row--best' : ''}`}>
          <span className="hbar-row__label" title={r.labelTitle}>
            {r.onClick ? <button onClick={r.onClick}>{r.label}</button> : r.label}
          </span>
          <div className="hbar-track" title={r.title}>
            <div
              className="hbar-fill"
              style={{
                width: `${Math.max(0, Math.min(1, r.fillRatio)) * 100}%`,
                backgroundColor: r.color,
              }}
            />
          </div>
          <span className="hbar-row__value">{r.value}</span>
        </div>
      ))}
    </div>
  )
}
