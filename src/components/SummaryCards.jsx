// Summary cards showing total time per category across the selected range.

import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from '../analysis/classify.js'
import { formatDuration } from '../utils/time.js'

export default function SummaryCards({ summary }) {
  if (!summary) return null

  return (
    <div className="summary-cards">
      {CATEGORIES.map((cat) => (
        <div
          key={cat}
          className="summary-card"
          style={{ borderTopColor: CATEGORY_COLORS[cat] }}
        >
          <span className="summary-card__label">{CATEGORY_LABELS[cat]}</span>
          <span className="summary-card__value">
            {formatDuration(summary[cat] || 0)}
          </span>
        </div>
      ))}
    </div>
  )
}
