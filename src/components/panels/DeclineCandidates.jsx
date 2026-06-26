// Meetings panel — recurring meetings the user consistently multitasks through.
// At rest: just the titles as pills; per-meeting detail on hover. Neutral tone.

import Panel from '../Panel.jsx'
import HoverInfo from '../ui/HoverInfo.jsx'

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
    <Panel title="Possible decline candidates" hint="Meetings you frequently message through">
      <div className="pill-row">
        {candidates.map((c) => (
          <HoverInfo
            key={c.title}
            content={`${Math.round(c.avgMessages)} msgs/occurrence over ${c.occurrences} occurrences`}
          >
            <span className="pill pill--warn">{c.title}</span>
          </HoverInfo>
        ))}
      </div>
    </Panel>
  )
}
