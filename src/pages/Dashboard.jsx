// Dashboard: date range picker + summary cards for the selected range.

import { useOutletContext } from 'react-router-dom'
import DateRangePicker from '../components/DateRangePicker.jsx'
import SummaryCards from '../components/SummaryCards.jsx'
import { useProductivityData } from '../hooks/useProductivityData.js'

export default function Dashboard() {
  const { startKey, endKey, setRange } = useOutletContext()
  const { loading, error, summary } = useProductivityData(startKey, endKey)

  return (
    <section>
      <h1>Dashboard</h1>
      <DateRangePicker
        startKey={startKey}
        endKey={endKey}
        onChange={(s, e) => setRange(s, e)}
      />

      {loading && <p className="status">Crunching your calendar and messages…</p>}
      {error && <p className="status status--error">{error}</p>}

      {!loading && !error && summary && <SummaryCards summary={summary} />}

      {!loading && !error && !summary && (
        <p className="status">No data for this range yet.</p>
      )}
    </section>
  )
}
