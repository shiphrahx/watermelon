// Messaging panel — message volume per working hour, Teams + Slack stacked.
// Bar length is proportional to the busiest hour; exact counts on hover.

import Panel from '../Panel.jsx'
import HoverInfo from '../ui/HoverInfo.jsx'

const TEAMS_COLOR = 'var(--color-meetings)' // blue
const SLACK_COLOR = 'var(--color-messaging)' // amber

export default function MessageVolumeByHour({ volume }) {
  const { hours = [], busiest } = volume || {}
  const max = Math.max(1, ...hours.map((h) => h.total))
  const anyData = hours.some((h) => h.total > 0)

  return (
    <Panel title="Message volume by hour" isEmpty={!anyData} emptyMessage="No messages found for this period.">
      <div>
        {hours.map((h) => {
          const total = h.total
          const barPct = (total / max) * 100
          const teamsShare = total > 0 ? (h.teams / total) * 100 : 0
          const slackShare = total > 0 ? (h.slack / total) * 100 : 0
          const isBusiest = busiest && h.startMinute === busiest.startMinute
          return (
            <div className={`vol-row${isBusiest ? ' vol-row--busiest' : ''}`} key={h.startMinute}>
              <span className="spark-label">{h.label}</span>
              <HoverInfo
                as="div"
                className="vol-track"
                content={`${h.label} · ${h.teams} Teams · ${h.slack} Slack · ${total} total`}
              >
                <div className="vol-bar" style={{ width: `${barPct}%` }}>
                  <div className="vol-seg" style={{ width: `${teamsShare}%`, backgroundColor: TEAMS_COLOR }} />
                  <div className="vol-seg" style={{ width: `${slackShare}%`, backgroundColor: SLACK_COLOR }} />
                </div>
              </HoverInfo>
            </div>
          )
        })}
      </div>
      {busiest && <p className="highlight-note">Busiest hour: {busiest.label} ({busiest.total} messages)</p>}
      <div className="legend" style={{ marginTop: '0.75rem' }}>
        <span className="legend__item"><span className="legend__swatch" style={{ backgroundColor: TEAMS_COLOR }} />Teams</span>
        <span className="legend__item"><span className="legend__swatch" style={{ backgroundColor: SLACK_COLOR }} />Slack</span>
      </div>
    </Panel>
  )
}
