// Date range picker. Defaults to today (single day). Emits date keys.

export default function DateRangePicker({ startKey, endKey, onChange }) {
  function handleStart(e) {
    const value = e.target.value
    // Keep the range valid: end never before start.
    const nextEnd = endKey < value ? value : endKey
    onChange(value, nextEnd)
  }

  function handleEnd(e) {
    const value = e.target.value
    const nextStart = startKey > value ? value : startKey
    onChange(nextStart, value)
  }

  return (
    <div className="date-range-picker">
      <label>
        <span>From</span>
        <input type="date" value={startKey} onChange={handleStart} />
      </label>
      <label>
        <span>To</span>
        <input type="date" value={endKey} onChange={handleEnd} />
      </label>
    </div>
  )
}
