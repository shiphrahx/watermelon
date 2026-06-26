// Reusable horizontal bar chart. Visual-first: bars are greyed by default with
// the highlighted row in solid accent; exact values appear on hover/tap via the
// shared Tooltip (when `hideValues`). Rounded caps via CSS.
//
// Row: { key, label, value, fillRatio (0..1), color, muted, highlight, onClick,
//        tooltip, labelTitle }

import HoverInfo from '../ui/HoverInfo.jsx'

export default function HBarChart({ rows, hideValues = false }) {
  return (
    <div className="hbar-list">
      {rows.map((r) => {
        const fill = r.muted ? 'var(--color-empty)' : r.color || 'var(--accent)'
        const bar = (
          <div className="hbar-track" title={hideValues ? undefined : r.title}>
            <div
              className="hbar-fill"
              style={{ width: `${Math.max(0, Math.min(1, r.fillRatio)) * 100}%`, backgroundColor: fill }}
            />
          </div>
        )
        return (
          <div key={r.key} className={`hbar-row${r.highlight ? ' hbar-row--best' : ''}`}>
            <span className="hbar-row__label" title={r.labelTitle}>
              {r.onClick ? <button onClick={r.onClick}>{r.label}</button> : r.label}
            </span>
            {hideValues ? (
              <HoverInfo as="div" className="hbar-track-wrap" content={r.tooltip ?? r.value}>
                {bar}
              </HoverInfo>
            ) : (
              bar
            )}
            {!hideValues && <span className="hbar-row__value">{r.value}</span>}
          </div>
        )
      })}
    </div>
  )
}
