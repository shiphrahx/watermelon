// Manual block reclassifications, stored per date + block-start-minute.
// Overrides the computed classification on subsequent loads.
// Shape: { [dateKey]: { [startMinute]: category } }

const STORAGE_KEY = 'watermelon.corrections'

function read() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function write(map) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function getDayCorrections(dateKey) {
  return read()[dateKey] || {}
}

export function saveCorrection(dateKey, startMinute, category) {
  const map = read()
  map[dateKey] = { ...(map[dateKey] || {}), [startMinute]: category }
  write(map)
}

export function clearDayCorrections(dateKey) {
  const map = read()
  delete map[dateKey]
  write(map)
}

export function clearAllCorrections() {
  write({})
}

// Apply stored corrections to a day's blocks, flagging overridden ones.
export function applyCorrections(blocks, dateKey, corrections = getDayCorrections(dateKey)) {
  if (!corrections || Object.keys(corrections).length === 0) return blocks
  return blocks.map((b) =>
    corrections[b.startMinute]
      ? { ...b, category: corrections[b.startMinute], corrected: true }
      : b,
  )
}
