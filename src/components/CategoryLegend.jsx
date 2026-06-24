// Colour legend mapping each category to its display name.

import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from '../analysis/classify.js'

export default function CategoryLegend() {
  return (
    <div className="legend">
      {CATEGORIES.map((cat) => (
        <span key={cat} className="legend__item">
          <span className="legend__swatch" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
          {CATEGORY_LABELS[cat]}
        </span>
      ))}
    </div>
  )
}
