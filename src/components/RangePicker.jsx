// Dashboard date-range control: preset dropdown (This week / Last week /
// Last 2 weeks / Custom), prev/next week arrows, and custom date inputs capped
// at 31 days.

import { RANGE_PRESETS, MAX_CUSTOM_RANGE_DAYS, clampCustomRange } from '../utils/ranges.js'

export default function RangePicker({ presetId, range, onPreset, onNavigateWeek, onCustomRange }) {
  const isCustom = presetId === 'custom'

  return (
    <div className="header-controls">
      <div className="week-nav">
        <button
          className="icon-button"
          aria-label="Previous week"
          onClick={() => onNavigateWeek(-1)}
        >
          ‹
        </button>
        <button
          className="icon-button"
          aria-label="Next week"
          onClick={() => onNavigateWeek(1)}
        >
          ›
        </button>
      </div>

      <div className="segmented" role="tablist" aria-label="Date range preset">
        {RANGE_PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={presetId === p.id}
            className={`segmented__btn${presetId === p.id ? ' segmented__btn--active' : ''}`}
            onClick={() => onPreset(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isCustom && (
        <div className="range-inputs">
          <input
            type="date"
            value={range.startKey}
            max={range.endKey}
            onChange={(e) =>
              onCustomRange(clampCustomRange({ startKey: e.target.value, endKey: range.endKey }))
            }
            aria-label="Start date"
          />
          <span>–</span>
          <input
            type="date"
            value={range.endKey}
            min={range.startKey}
            onChange={(e) =>
              onCustomRange(clampCustomRange({ startKey: range.startKey, endKey: e.target.value }))
            }
            aria-label="End date"
          />
          <span className="muted">max {MAX_CUSTOM_RANGE_DAYS} days</span>
        </div>
      )}
    </div>
  )
}
