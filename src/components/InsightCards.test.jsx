import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import InsightCards from './InsightCards.jsx'
import TrendIndicator from './TrendIndicator.jsx'

const insights = {
  focusMinutes: 380,
  meetingMinutes: 180,
  focusRate: 70,
  busiestDay: { weekday: 'Tuesday' },
  mostFocusedDay: { weekday: 'Wednesday' },
}
const trends = {
  focusMinutes: { direction: 'up', deltaPct: 20 },
  meetingMinutes: { direction: 'down', deltaPct: -10 },
  focusRate: { direction: 'up', deltaPct: 5 },
}

describe('InsightCards', () => {
  it('renders the five headline metrics with display names', () => {
    render(<InsightCards insights={insights} trends={trends} />)
    expect(screen.getByText('Deep focus')).toBeInTheDocument()
    expect(screen.getByText('In meetings')).toBeInTheDocument()
    expect(screen.getByText('Busiest day')).toBeInTheDocument()
    expect(screen.getByText('Most focused day')).toBeInTheDocument()
    expect(screen.getByText('Focus rate')).toBeInTheDocument()
  })

  it('formats durations as Xh Ym and focus rate as a percentage', () => {
    render(<InsightCards insights={insights} trends={trends} />)
    expect(screen.getByText('6h 20m')).toBeInTheDocument()
    expect(screen.getByText('3h')).toBeInTheDocument()
    expect(screen.getByText('70%')).toBeInTheDocument()
    expect(screen.getByText('Tuesday')).toBeInTheDocument()
    expect(screen.getByText('Wednesday')).toBeInTheDocument()
  })

  it('never leaks raw category keys', () => {
    const { container } = render(<InsightCards insights={insights} trends={trends} />)
    expect(container.textContent).not.toMatch(/comms|possible-adhoc/)
  })
})

describe('TrendIndicator', () => {
  it('shows a percentage for a real change', () => {
    render(<TrendIndicator trend={{ direction: 'up', deltaPct: 23 }} />)
    expect(screen.getByText(/23%/)).toBeInTheDocument()
    expect(screen.getByText(/vs last week/)).toBeInTheDocument()
  })

  it('shows "new" when there is no baseline', () => {
    render(<TrendIndicator trend={{ direction: 'up', deltaPct: null }} />)
    expect(screen.getByText(/new/)).toBeInTheDocument()
  })

  it('shows "no change" when flat', () => {
    render(<TrendIndicator trend={{ direction: 'flat', deltaPct: 0 }} />)
    expect(screen.getByText(/no change/)).toBeInTheDocument()
  })
})
