// Panel 1 — Time breakdown: a horizontal stacked bar per day, colour-coded by
// category. Weekends and no-data days are greyed out. Clicking a day with data
// navigates to its day view.

import Panel from '../Panel.jsx'
import CategoryLegend from '../CategoryLegend.jsx'
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from '../../analysis/classify.js'
import { formatDuration } from '../../utils/time.js'

function StackedBar({ day }) {
  if (!day.hasData || !day.isWeekday || day.total === 0) {
    return <div className="stacked-bar stacked-bar--empty" />
  }
  const denom = CATEGORIES.reduce((acc, c) => acc + day.categories[c], 0) || 1
  return (
    <div className="stacked-bar">
      {CATEGORIES.map((cat) => {
        const mins = day.categories[cat]
        if (mins <= 0) return null
        const pct = (mins / denom) * 100
        return (
          <div
            key={cat}
            className="stacked-bar__seg"
            style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[cat] }}
            title={`${CATEGORY_LABELS[cat]} — ${formatDuration(mins)} (${Math.round(pct)}%)`}
          />
        )
      })}
    </div>
  )
}

export default function TimeBreakdown({ perDay = [], onSelectDay, qualityLabels = {} }) {
  const anyData = perDay.some((d) => d.hasData && d.isWeekday)
  return (
    <Panel
      title="Time breakdown"
      hint="How each working day was spent"
      isEmpty={!anyData}
      emptyMessage="No activity found for this period."
    >
      <div className="day-bars">
        {perDay.map((day) => (
          <div className="day-bar-row" key={day.dateKey}>
            <span className="day-bar-row__label">
              {day.hasData && day.isWeekday && onSelectDay ? (
                <button onClick={() => onSelectDay(day.dateKey)}>{day.weekday}</button>
              ) : (
                day.weekday
              )}
              {qualityLabels[day.dateKey] && (
                <span className={`pill day-pill--${qualityLabels[day.dateKey].split(' ')[0].toLowerCase()}`}>
                  {qualityLabels[day.dateKey]}
                </span>
              )}
            </span>
            <StackedBar day={day} />
          </div>
        ))}
      </div>
      <CategoryLegend />
    </Panel>
  )
}
