// The five headline insight cards at the top of the dashboard.

import { formatDuration } from '../utils/time.js'
import TrendIndicator from './TrendIndicator.jsx'

function Card({ label, value, small, trend, children }) {
  return (
    <div className="insight-card">
      <span className="insight-card__label">{label}</span>
      <span className={`insight-card__value${small ? ' insight-card__value--small' : ''}`}>
        {value}
      </span>
      {trend && <TrendIndicator trend={trend} />}
      {children}
    </div>
  )
}

export default function InsightCards({ insights, trends }) {
  const focusRate = Math.round(insights.focusRate)
  return (
    <div className="insight-cards">
      <Card
        label="Deep focus"
        value={formatDuration(insights.focusMinutes)}
        trend={trends?.focusMinutes}
      />
      <Card
        label="In meetings"
        value={formatDuration(insights.meetingMinutes)}
        trend={trends?.meetingMinutes}
      />
      <Card
        label="Busiest day"
        small
        value={insights.busiestDay ? insights.busiestDay.weekday : '—'}
      />
      <Card
        label="Most focused day"
        small
        value={insights.mostFocusedDay ? insights.mostFocusedDay.weekday : '—'}
      />
      <Card label="Focus rate" value={`${focusRate}%`} trend={trends?.focusRate} />
    </div>
  )
}
