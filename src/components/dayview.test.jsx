import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DayStats from './DayStats.jsx'
import DayTimeline from './DayTimeline.jsx'
import RangePicker from './RangePicker.jsx'
import { buildDayBlocks } from '../utils/time.js'

describe('DayStats', () => {
  it('renders the four day stats with human formatting', () => {
    render(
      <DayStats
        dayInsight={{
          focusRate: 67,
          meetingMinutes: 90,
          longestFocusBlock: { minutes: 80, startMinute: 640 }, // 10:40
          firstMessage: { label: '08:52', beforeWorkStart: true },
        }}
      />,
    )
    expect(screen.getByText('67%')).toBeInTheDocument()
    expect(screen.getByText('1h 30m')).toBeInTheDocument()
    expect(screen.getByText('1h 20m starting at 10:40')).toBeInTheDocument()
    expect(screen.getByText('08:52 — you started early')).toBeInTheDocument()
  })

  it('handles a day with no messages or focus', () => {
    render(
      <DayStats
        dayInsight={{
          focusRate: 0,
          meetingMinutes: 0,
          longestFocusBlock: null,
          firstMessage: null,
        }}
      />,
    )
    expect(screen.getByText('No messages')).toBeInTheDocument()
    expect(screen.getByText('None')).toBeInTheDocument()
  })
})

describe('DayTimeline', () => {
  const KEY = '2025-06-23'
  const cats = ['meeting', 'meeting', 'focus', 'focus']
  const blocks = buildDayBlocks(KEY, '09:00', '18:00')
    .slice(0, 4)
    .map((b, i) => ({ ...b, category: cats[i] }))
  const day = {
    dateKey: KEY,
    blocks,
    events: [
      { subject: 'Daily standup', start: new Date(`${KEY}T09:00:00`), end: new Date(`${KEY}T10:00:00`) },
    ],
  }

  it('shows the meeting title and a human focus label', () => {
    render(<DayTimeline day={day} workingStart="09:00" workingEnd="18:00" />)
    expect(screen.getByText('Daily standup')).toBeInTheDocument()
    expect(screen.getByText(/Deep focus — 1h/)).toBeInTheDocument()
  })

  it('never shows raw category keys', () => {
    const { container } = render(
      <DayTimeline day={day} workingStart="09:00" workingEnd="18:00" />,
    )
    expect(container.textContent).not.toMatch(/comms|possible-adhoc/)
  })
})

describe('RangePicker', () => {
  const base = {
    presetId: 'this-week',
    range: { startKey: '2025-06-23', endKey: '2025-06-25' },
    onPreset: vi.fn(),
    onNavigateWeek: vi.fn(),
    onCustomRange: vi.fn(),
  }

  it('exposes presets and week navigation', () => {
    const onNavigateWeek = vi.fn()
    render(<RangePicker {...base} onNavigateWeek={onNavigateWeek} />)
    fireEvent.click(screen.getByLabelText('Previous week'))
    expect(onNavigateWeek).toHaveBeenCalledWith(-1)
    fireEvent.click(screen.getByLabelText('Next week'))
    expect(onNavigateWeek).toHaveBeenCalledWith(1)
  })

  it('shows custom date inputs only in custom mode', () => {
    const { rerender } = render(<RangePicker {...base} />)
    expect(screen.queryByLabelText('Start date')).toBeNull()
    rerender(<RangePicker {...base} presetId="custom" />)
    expect(screen.getByLabelText('Start date')).toBeInTheDocument()
    expect(screen.getByLabelText('End date')).toBeInTheDocument()
  })
})
