import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TimeBreakdown from './TimeBreakdown.jsx'
import FocusWindows from './FocusWindows.jsx'
import TopConsumers from './TopConsumers.jsx'
import FocusByDay from './FocusByDay.jsx'

describe('TimeBreakdown', () => {
  const perDay = [
    {
      dateKey: '2025-06-23',
      weekday: 'Monday',
      isWeekday: true,
      hasData: true,
      categories: { focus: 300, meeting: 120, comms: 60, 'possible-adhoc': 60 },
      total: 540,
    },
    {
      dateKey: '2025-06-28',
      weekday: 'Saturday',
      isWeekday: false,
      hasData: false,
      categories: { focus: 0, meeting: 0, comms: 0, 'possible-adhoc': 0 },
      total: 540,
    },
  ]

  it('renders a row per day and a clickable day with data', () => {
    const onSelectDay = vi.fn()
    render(<TimeBreakdown perDay={perDay} onSelectDay={onSelectDay} />)
    fireEvent.click(screen.getByRole('button', { name: 'Monday' }))
    expect(onSelectDay).toHaveBeenCalledWith('2025-06-23')
    // Saturday has no data => plain label, not a button
    expect(screen.queryByRole('button', { name: 'Saturday' })).toBeNull()
  })

  it('shows an empty state when no weekday has data', () => {
    render(<TimeBreakdown perDay={[perDay[1]]} />)
    expect(screen.getByText(/No activity found/)).toBeInTheDocument()
  })

  it('does not render raw category keys', () => {
    const { container } = render(<TimeBreakdown perDay={perDay} />)
    expect(container.textContent).not.toMatch(/comms|possible-adhoc/)
  })
})

describe('FocusWindows', () => {
  const focusWindows = {
    slots: [
      { startMinute: 540, endMinute: 600, label: '09:00–10:00', avgFocusMinutes: 0 },
      { startMinute: 600, endMinute: 660, label: '10:00–11:00', avgFocusMinutes: 60 },
    ],
    top: { startMinute: 600, endMinute: 660, label: '10:00–11:00', avgFocusMinutes: 60 },
  }

  it('highlights the best window with the on-average qualifier', () => {
    render(<FocusWindows focusWindows={focusWindows} />)
    expect(
      screen.getByText('Your best focus window is 10:00–11:00 on average across this week.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Average focus time per hour across the selected period')).toBeInTheDocument()
    expect(screen.getByText('60m avg')).toBeInTheDocument()
  })

  it('shows an empty state when there is no focus', () => {
    render(<FocusWindows focusWindows={{ slots: [], top: null }} />)
    expect(screen.getByText(/No focus blocks detected/)).toBeInTheDocument()
  })
})

describe('TopConsumers', () => {
  const topConsumers = [
    { subject: 'Weekly team standup', minutes: 180 },
    { subject: 'Sprint planning', minutes: 150 },
  ]

  it('lists events with durations', () => {
    render(<TopConsumers topConsumers={topConsumers} />)
    expect(screen.getByText('Weekly team standup')).toBeInTheDocument()
    expect(screen.getByText('3h')).toBeInTheDocument()
    expect(screen.getByText('Sprint planning')).toBeInTheDocument()
  })

  it('shows an empty state with no meetings', () => {
    render(<TopConsumers topConsumers={[]} />)
    expect(screen.getByText(/No meetings found/)).toBeInTheDocument()
  })
})

describe('FocusByDay', () => {
  const focusByDay = {
    bars: [
      { dateKey: '2025-06-23', weekday: 'Monday', focusMinutes: 120 },
      { dateKey: '2025-06-24', weekday: 'Tuesday', focusMinutes: 300 },
    ],
    best: { dateKey: '2025-06-24', weekday: 'Tuesday', focusMinutes: 300 },
  }

  it('labels the best focus day and navigates on click', () => {
    const onSelectDay = vi.fn()
    render(<FocusByDay focusByDay={focusByDay} onSelectDay={onSelectDay} />)
    expect(screen.getByText('Best focus day: Tuesday')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Tuesday' }))
    expect(onSelectDay).toHaveBeenCalledWith('2025-06-24')
  })

  it('shows an empty state when there is no focus', () => {
    render(<FocusByDay focusByDay={{ bars: [], best: null }} />)
    expect(screen.getByText(/No focus blocks detected/)).toBeInTheDocument()
  })
})
