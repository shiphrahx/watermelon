// Messaging panel — message volume per working hour, Teams + Slack stacked.

import Panel from '../Panel.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'

const TEAMS_COLOR = CATEGORY_COLORS.meetings // blue
const SLACK_COLOR = CATEGORY_COLORS.messaging // amber

export default function MessageVolumeByHour({ volume }) {
  const { hours = [], busiest } = volume || {}
  const max = Math.max(1, ...hours.map((h) => h.total))
  const anyData = hours.some((h) => h.total > 0)

  return (
    <Panel
      title="Message volume by hour"
      isEmpty={!anyData}
      emptyMessage="No messages found for this period."
    >
      <div>
        {hours.map((h) => (
          <div className="vol-row" key={h.startMinute}>
            <span className="spark-label">{h.label}</span>
            <div className="vol-track" title={`${h.label} · ${h.teams} Teams · ${h.slack} Slack`}>
              <div className="vol-seg" style={{ width: `${(h.teams / max) * 100}%`, backgroundColor: TEAMS_COLOR }} />
              <div className="vol-seg" style={{ width: `${(h.slack / max) * 100}%`, backgroundColor: SLACK_COLOR }} />
            </div>
            <span className="hbar-row__value">{h.total}</span>
          </div>
        ))}
      </div>
      {busiest && <p className="highlight-note">Busiest hour: {busiest.label} ({busiest.total} messages)</p>}
      <div className="legend" style={{ marginTop: '0.75rem' }}>
        <span className="legend__item"><span className="legend__swatch" style={{ backgroundColor: TEAMS_COLOR }} />Teams</span>
        <span className="legend__item"><span className="legend__swatch" style={{ backgroundColor: SLACK_COLOR }} />Slack</span>
      </div>
    </Panel>
  )
}
