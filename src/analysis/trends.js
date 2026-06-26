// Pure trend computations over an array of stored weekly summaries
// (oldest -> newest). No AI — plain-English sentences come from template logic.

const MIN_FOR_TREND = 2

// Best week by focus rate (ties resolve to the most recent).
function bestWeekByFocusRate(weeks) {
  let best = null
  for (const w of weeks) {
    if (best === null || w.focusRate >= best.focusRate) best = w
  }
  return best
}

// Direction of a numeric series over its last `window` points.
function direction(values, window = 4, threshold = 5) {
  const slice = values.slice(-window)
  if (slice.length < 2) return 'flat'
  const delta = slice[slice.length - 1] - slice[0]
  if (delta > threshold) return 'up'
  if (delta < -threshold) return 'down'
  return 'flat'
}

// Length of the current strictly-increasing run at the end of a series.
function climbingRun(values) {
  let run = 1
  for (let i = values.length - 1; i > 0; i--) {
    if (values[i] > values[i - 1]) run++
    else break
  }
  return run
}

export function computeTrendStats(weeks) {
  if (!weeks || weeks.length < MIN_FOR_TREND) {
    return { hasEnough: false }
  }

  const current = weeks[weeks.length - 1]
  const previous = weeks[weeks.length - 2]
  const focusDelta = Math.round(current.focusRate - previous.focusRate)

  const focusRates = weeks.map((w) => w.focusRate)
  const meetingMins = weeks.map((w) => w.meetingMinutes)
  const focusDir = direction(focusRates)
  const meetingClimb = climbingRun(meetingMins)
  const windowLen = Math.min(4, weeks.length)

  let sentence
  if (focusDir === 'up') {
    sentence = `Your focus rate has trended up over the last ${windowLen} weeks.`
  } else if (focusDir === 'down') {
    sentence = `Your focus rate has trended down over the last ${windowLen} weeks.`
  } else if (meetingClimb >= 3) {
    sentence = `Meeting load has been climbing for ${meetingClimb} weeks.`
  } else {
    sentence = 'Your focus rate has held roughly steady recently.'
  }

  return {
    hasEnough: true,
    current,
    previous,
    focusDelta,
    bestWeek: bestWeekByFocusRate(weeks),
    sentence,
  }
}

// Series shaped for charts: [{ weekKey, value }].
export function series(weeks, key) {
  return weeks.map((w) => ({ weekKey: w.weekKey, value: w[key] }))
}
