// Time and date helpers used by the analysis logic and the UI.
// Blocks are 30 minutes wide; the working day is sliced into these blocks.

export const BLOCK_MINUTES = 30
export const MS_PER_MINUTE = 60 * 1000

// "YYYY-MM-DD" for a Date in local time.
export function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// Parse "YYYY-MM-DD" into a local Date at midnight.
export function fromDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0)
}

// "HH:MM" -> minutes since midnight.
export function parseTimeToMinutes(hhmm) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// minutes since midnight -> "HH:MM".
export function minutesToTimeLabel(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

// Inclusive list of date keys between two date keys.
export function dateKeysInRange(startKey, endKey) {
  const keys = []
  let cur = fromDateKey(startKey)
  const end = fromDateKey(endKey)
  while (cur <= end) {
    keys.push(toDateKey(cur))
    cur = new Date(cur.getTime())
    cur.setDate(cur.getDate() + 1)
  }
  return keys
}

// Build the array of 30-minute block boundaries for one day, given working
// hours. Returns objects with the block start/end as Date and minute offsets.
export function buildDayBlocks(dateKey, workingStart, workingEnd) {
  const startMin = parseTimeToMinutes(workingStart)
  const endMin = parseTimeToMinutes(workingEnd)
  const dayStart = fromDateKey(dateKey)
  const blocks = []
  for (let m = startMin; m + BLOCK_MINUTES <= endMin; m += BLOCK_MINUTES) {
    const start = new Date(dayStart.getTime() + m * MS_PER_MINUTE)
    const end = new Date(dayStart.getTime() + (m + BLOCK_MINUTES) * MS_PER_MINUTE)
    blocks.push({ startMinute: m, endMinute: m + BLOCK_MINUTES, start, end })
  }
  return blocks
}

// ISO string for the start of a day (local) — handy for Graph $filter ranges.
export function startOfDayISO(dateKey) {
  return fromDateKey(dateKey).toISOString()
}

// ISO string for the end of a day (local, 23:59:59.999).
export function endOfDayISO(dateKey) {
  const d = fromDateKey(dateKey)
  d.setHours(23, 59, 59, 999)
  return d.toISOString()
}

// Format minutes as a human label, e.g. 90 -> "1h 30m".
export function formatDuration(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}
