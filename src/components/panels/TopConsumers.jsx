// Panel 3 — What's consuming your time: top 5 event titles by total duration.

import Panel from '../Panel.jsx'
import { formatDuration } from '../../utils/time.js'

export default function TopConsumers({ topConsumers = [] }) {
  const max = Math.max(1, ...topConsumers.map((t) => t.minutes))
  return (
    <Panel
      title="What's consuming your time"
      hint="Top time consumers this week"
      isEmpty={topConsumers.length === 0}
      emptyMessage="No meetings found for this period."
    >
      <ol className="ranked-list">
        {topConsumers.map((t) => (
          <li key={t.subject}>
            <span className="hbar-row__label" title={t.subject}>
              {t.subject}
            </span>
            <span className="hbar-row__value">{formatDuration(t.minutes)}</span>
            <div className="ranked-bar">
              <div className="ranked-bar__fill" style={{ width: `${(t.minutes / max) * 100}%` }} />
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
