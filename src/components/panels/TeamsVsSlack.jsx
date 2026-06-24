// Messaging panel — Teams vs Slack split as a donut, with optional pattern note.

import Panel from '../Panel.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'

const TEAMS_COLOR = CATEGORY_COLORS.meetings
const SLACK_COLOR = CATEGORY_COLORS.messaging

export default function TeamsVsSlack({ split }) {
  const { teamsPct = 0, slackPct = 0, teamsCount = 0, slackCount = 0, patternHolds } = split || {}
  const isEmpty = teamsCount + slackCount === 0

  return (
    <Panel
      title="Teams vs Slack split"
      isEmpty={isEmpty}
      emptyMessage="No messages found for this period."
    >
      <div className="donut-wrap">
        <div
          className="donut"
          role="img"
          aria-label={`${teamsPct}% Teams, ${slackPct}% Slack`}
          style={{
            background: `conic-gradient(${TEAMS_COLOR} 0 ${teamsPct}%, ${SLACK_COLOR} ${teamsPct}% 100%)`,
          }}
        >
          <div className="donut__hole" />
        </div>
        <div className="donut-legend">
          <span className="legend__item">
            <span className="legend__swatch" style={{ backgroundColor: TEAMS_COLOR }} />
            {teamsPct}% Teams
          </span>
          <span className="legend__item">
            <span className="legend__swatch" style={{ backgroundColor: SLACK_COLOR }} />
            {slackPct}% Slack
          </span>
        </div>
      </div>
      <p className="headline-explain">This week: {teamsPct}% Teams · {slackPct}% Slack</p>
      {patternHolds && (
        <p className="highlight-note">
          You use Teams more on meeting-heavy days and Slack more on lighter days.
        </p>
      )}
    </Panel>
  )
}
