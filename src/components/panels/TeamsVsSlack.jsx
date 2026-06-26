// Messaging panel — Teams vs Slack split as a donut.

import Panel from '../Panel.jsx'
import Donut from '../charts/Donut.jsx'
import { CATEGORY_COLORS } from '../../analysis/classify.js'

const TEAMS_COLOR = CATEGORY_COLORS.meeting
const SLACK_COLOR = CATEGORY_COLORS.messaging

export default function TeamsVsSlack({ split }) {
  const { teamsPct = 0, slackPct = 0, teamsCount = 0, slackCount = 0, patternHolds } = split || {}
  const isEmpty = teamsCount + slackCount === 0

  const data = [
    { key: 'teams', label: 'Teams', color: TEAMS_COLOR, value: teamsCount, display: `${teamsPct}%` },
    { key: 'slack', label: 'Slack', color: SLACK_COLOR, value: slackCount, display: `${slackPct}%` },
  ]

  return (
    <Panel title="Teams vs Slack" isEmpty={isEmpty} emptyMessage="No messages found for this period.">
      <Donut data={data} centerValue={`${teamsPct}%`} centerLabel="Teams" />
      {patternHolds && (
        <p className="highlight-note">
          You use Teams more on meeting-heavy days and Slack more on lighter days.
        </p>
      )}
    </Panel>
  )
}
