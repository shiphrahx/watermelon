// Meetings panel — recurring meetings the user consistently multitasks through.
// Neutral observation, not advice.

import Panel from '../Panel.jsx'

export default function DeclineCandidates({ candidates = [] }) {
  if (candidates.length === 0) {
    return (
      <Panel title="Possible decline candidates">
        <p className="panel__empty">
          No meetings stand out as multitasking-heavy. You're present in the meetings you attend.
        </p>
      </Panel>
    )
  }

  return (
    <Panel title="Possible decline candidates">
      <p className="panel__hint" style={{ marginTop: 0 }}>
        You're frequently messaging during these meetings — they may not need your full attention.
      </p>
      <div className="simple-list">
        {candidates.map((c) => (
          <div className="pair-list__row" key={c.title}>
            <span style={{ gridColumn: '1 / 2' }}>{c.title}</span>
            <span className="muted" style={{ gridColumn: '2 / 4', textAlign: 'right' }}>
              {Math.round(c.avgMessages)} msgs/occurrence · {c.occurrences}×
            </span>
          </div>
        ))}
      </div>
    </Panel>
  )
}
