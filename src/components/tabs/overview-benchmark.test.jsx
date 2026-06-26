import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import OverviewTab from './OverviewTab.jsx'
import { computeInsights } from '../../analysis/insights.js'
import { buildDayBlocks } from '../../utils/time.js'
import { saveWeek, clearHistory } from '../../storage/history.js'
import { isoWeekKey } from '../../utils/ranges.js'

beforeEach(() => {
  clearHistory()
  localStorage.removeItem('watermelon.settings')
})

const KEY = '2025-06-23' // Monday
function makeDay(dateKey, cats) {
  const blocks = buildDayBlocks(dateKey, '09:00', '18:00').map((b, i) => ({ ...b, category: cats[i] || 'focus' }))
  return { dateKey, blocks, events: [], messages: [{ timestamp: 1 }] }
}
const days = [makeDay(KEY, Array(18).fill('focus'))]
const insights = computeInsights({ days, workingStart: '09:00', workingEnd: '18:00' })
const props = { insights, trends: null, days, workingStart: '09:00', workingEnd: '18:00', onSelectDay: () => {} }

describe('OverviewTab self-benchmarking', () => {
  it('shows nothing with fewer than 4 weeks of history', () => {
    saveWeek(isoWeekKey(KEY), { focusRate: 90 })
    render(<OverviewTab {...props} />)
    expect(screen.queryByText(/most focused week yet/)).toBeNull()
  })

  it('ranks the current week once 4+ weeks exist', () => {
    saveWeek('2025-W01', { focusRate: 10 })
    saveWeek('2025-W02', { focusRate: 20 })
    saveWeek('2025-W03', { focusRate: 30 })
    saveWeek(isoWeekKey(KEY), { focusRate: 95 }) // current week, highest
    render(<OverviewTab {...props} />)
    expect(screen.getByText('Your most focused week yet.')).toBeInTheDocument()
  })
})
