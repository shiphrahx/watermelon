import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import TrendsTab from './TrendsTab.jsx'
import { saveWeek, clearHistory } from '../../storage/history.js'

beforeEach(() => {
  clearHistory()
})

const wk = (weekKey, focusRate) => ({
  weekKey,
  focusRate,
  focusMinutes: focusRate * 6,
  meetingMinutes: 600,
  shallowMinutes: 60,
  messagingMinutes: 120,
  fragmentationCount: 2,
  perDay: [],
  recurringMeetings: [],
})

describe('TrendsTab', () => {
  it('shows the empty state with fewer than 2 weeks', () => {
    saveWeek('2026-W20', wk('2026-W20', 40))
    render(<TrendsTab />)
    expect(screen.getByText(/Trends will appear once you've analysed a few weeks/)).toBeInTheDocument()
  })

  it('renders the three charts and summary stats with enough history', () => {
    saveWeek('2026-W20', wk('2026-W20', 30))
    saveWeek('2026-W21', wk('2026-W21', 45))
    saveWeek('2026-W22', wk('2026-W22', 60))
    render(<TrendsTab />)

    expect(screen.getByText('Focus rate over time')).toBeInTheDocument()
    expect(screen.getByText('Meeting vs focus hours')).toBeInTheDocument()
    expect(screen.getByText('Fragmentation over time')).toBeInTheDocument()
    expect(screen.getByText('Best week')).toBeInTheDocument()
    // upward trend sentence
    expect(screen.getByText(/trended up/)).toBeInTheDocument()
  })
})
