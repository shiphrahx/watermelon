// Day view: a colour-coded timeline per day in the selected range, with a
// category legend.

import { useOutletContext } from 'react-router-dom'
import DateRangePicker from '../components/DateRangePicker.jsx'
import Timeline from '../components/Timeline.jsx'
import { useProductivityData } from '../hooks/useProductivityData.js'
import { CATEGORIES, CATEGORY_LABELS, CATEGORY_COLORS } from '../analysis/classify.js'

function Legend() {
  return (
    <div className="legend">
      {CATEGORIES.map((cat) => (
        <span key={cat} className="legend__item">
          <span
            className="legend__swatch"
            style={{ backgroundColor: CATEGORY_COLORS[cat] }}
          />
          {CATEGORY_LABELS[cat]}
        </span>
      ))}
    </div>
  )
}

export default function DayView() {
  const { startKey, endKey, setRange } = useOutletContext()
  const { loading, error, days } = useProductivityData(startKey, endKey)

  return (
    <section>
      <h1>Day view</h1>
      <DateRangePicker
        startKey={startKey}
        endKey={endKey}
        onChange={(s, e) => setRange(s, e)}
      />
      <Legend />

      {loading && <p className="status">Building your timeline…</p>}
      {error && <p className="status status--error">{error}</p>}

      {!loading && !error && (
        <div className="timelines">
          {days.map((day) => (
            <Timeline key={day.dateKey} dateKey={day.dateKey} blocks={day.blocks} />
          ))}
          {days.length === 0 && <p className="status">No days to show.</p>}
        </div>
      )}
    </section>
  )
}
