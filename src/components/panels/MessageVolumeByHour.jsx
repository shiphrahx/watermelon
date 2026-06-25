// Messaging panel — message volume per working hour, Teams + Slack stacked.
//
// Each row's bar length is proportional to that hour's total message count
// relative to the busiest hour (which renders full width). Inside the bar, the
// Teams and Slack counts are shown as stacked segments split by their share.

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
        {hours.map((h) => {
          const total = h.total
          const barPct = (total / max) * 100 // proportional to the busiest hour
          const teamsShare = total > 0 ? (h.teams / total) * 100 : 0
          const slackShare = total > 0 ? (h.slack / total) * 100 : 0
          const isBusiest = busiest && h.startMinute === busiest.startMinute
          return (
            <div className={`vol-row${isBusiest ? ' vol-row--busiest' : ''}`} key={h.startMinute}>
              <span className="spark-label">{h.label}</span>
              <div className="vol-track">
                <div
                  className="vol-bar"
                  style={{ width: `${barPct}%` }}
                  title={`${h.label} · ${h.teams} Teams · ${h.slack} Slack`}
                >
                  <div className="vol-seg" style={{ width: `${teamsShare}%`, backgroundColor: TEAMS_COLOR }} />
                  <div className="vol-seg" style={{ width: `${slackShare}%`, backgroundColor: SLACK_COLOR }} />
                </div>
              </div>
              <span className="hbar-row__value">{total}</span>
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
