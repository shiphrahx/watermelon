// Self-benchmarking: rank the current week's focus rate against stored history.
// Returns a framing string, or null when there isn't enough history (< 4 weeks)
// or the current week isn't in the store.

function ordinal(n) {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function benchmarkWeek(weeks, currentWeekKey) {
  if (!weeks || weeks.length < 4) return null
  const current = weeks.find((w) => w.weekKey === currentWeekKey)
  if (!current) return null

  const M = weeks.length
  const higher = weeks.filter((w) => w.focusRate > current.focusRate).length
  const rank = higher + 1 // 1 = most focused

  if (rank === 1) return 'Your most focused week yet.'

  const topQuartile = Math.max(1, Math.ceil(M * 0.25))
  if (rank <= topQuartile) {
    return `One of your more focused weeks — ${ordinal(rank)} best of ${M} tracked.`
  }

  const bottomQuartileStart = M - Math.floor(M * 0.25) + 1
  if (rank >= bottomQuartileStart) return 'A lighter week for focus than usual.'

  return 'About average for you.'
}
