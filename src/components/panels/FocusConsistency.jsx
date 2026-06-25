// Focus panel — consistency of focus timing: a qualitative verdict plus a dot
// plot of focus-block start times per day on a 09:00–18:00 axis.

import Panel from '../Panel.jsx'
import { parseTimeToMinutes, minutesToTimeLabel } from '../../utils/time.js'

const VERDICTS = {
  low: 'Your focus time is consistent — you tend to focus around the same time each day.',
  medium: 'Your focus time varies day to day — no strong fixed pattern.',
  high: 'Your focus time is unpredictable — it moves significantly from day to day.',
  insufficient: 'Not enough focus days to assess consistency.',
}

export default function FocusConsistency({ consistency, workingStart = '09:00', workingEnd = '18:00' }) {
  const { level = 'insufficient', perDay = [] } = consistency || {}
  const startMin = parseTimeToMinutes(workingStart)
  const endMin = parseTimeToMinutes(workingEnd)
  const span = endMin - startMin || 1
  const pos = (m) => `${((m - startMin) / span) * 100}%`

  const hasDots = perDay.some((d) => d.starts.length > 0)

  const axisTicks = [9 * 60, 12 * 60, 15 * 60, 18 * 60].filter((m) => m >= startMin && m <= endMin)

  return (
    <Panel
      title="Focus consistency"
      hint="Each dot marks the start time of a focus block. Clustered dots mean your focus happens at consistent times."
      isEmpty={!hasDots}
      emptyMessage="No focus blocks detected — try a wider date range."
    >
      <p className="headline-explain" style={{ marginTop: 0 }}>{VERDICTS[level]}</p>
      <div>
        {perDay.map((d) => (
          <div className="dotplot-row" key={d.dateKey}>
            <span className="spark-label">{d.weekday}</span>
            <div className="dotplot-track">
              {d.starts.map((m, i) => (
                <span
                  key={i}
                  className="dotplot-dot"
                  style={{ left: pos(m) }}
                  title={`${d.weekday} · focus from ${minutesToTimeLabel(m)}`}
                />
              ))}
            </div>
          </div>
        ))}
        {/* Shared time axis aligned to the dot tracks (09:00–18:00 scale) */}
        <div className="dotplot-row dotplot-axis">
          <span />
          <div className="dotplot-axis-track">
            {axisTicks.map((m) => (
              <span key={m} className="dotplot-axis-tick" style={{ left: pos(m) }}>
                {minutesToTimeLabel(m)}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Panel>
  )
}
