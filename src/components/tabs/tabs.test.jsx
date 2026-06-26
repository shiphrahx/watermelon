import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TabBar from '../TabBar.jsx'
import OverviewTab from './OverviewTab.jsx'
import MeetingsTab from './MeetingsTab.jsx'
import FocusTab from './FocusTab.jsx'
import MessagingTab from './MessagingTab.jsx'
import { computeInsights } from '../../analysis/insights.js'
import { buildDayBlocks } from '../../utils/time.js'

const WS = '09:00'
const WE = '18:00'

function ev(subject, dateKey, s, e) {
  return { subject, start: new Date(`${dateKey}T${s}:00`), end: new Date(`${dateKey}T${e}:00`) }
}
function msg(dateKey, hhmm, source, conv) {
  const m = { timestamp: new Date(`${dateKey}T${hhmm}:00`).getTime(), source }
  if (source === 'slack') m.channel = conv
  else m.chatId = conv
  return m
}

// Two realistic weekdays with a mix of categories, events, and messages.
function makeDay(dateKey, cats, events, messages) {
  const blocks = buildDayBlocks(dateKey, WS, WE).map((b, i) => ({ ...b, category: cats[i] || 'focus' }))
  return { dateKey, blocks, events, messages }
}

const MON = '2025-06-23'
const TUE = '2025-06-24'
const cats = [
  'meeting', 'meeting', 'focus', 'focus', 'comms', 'shallow',
  'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus', 'focus',
]
const days = [
  makeDay(
    MON,
    cats,
    [ev('Standup', MON, '09:00', '09:30'), ev('Planning', MON, '09:30', '10:00')],
    [msg(MON, '09:10', 'teams', 'c1'), msg(MON, '14:10', 'slack', 'c2')],
  ),
  makeDay(
    TUE,
    cats,
    [ev('Standup', TUE, '09:00', '09:30')],
    [msg(TUE, '10:10', 'slack', 'c3'), msg(TUE, '10:12', 'slack', 'c2')],
  ),
]
const insights = computeInsights({ days, workingStart: WS, workingEnd: WE })
const tabProps = { insights, trends: null, days, workingStart: WS, workingEnd: WE, onSelectDay: vi.fn() }

describe('TabBar', () => {
  it('highlights the active tab and switches', () => {
    const onChange = vi.fn()
    render(<TabBar active="meetings" onChange={onChange} onDayView={vi.fn()} />)
    const meetings = screen.getByRole('tab', { name: 'Meetings' })
    expect(meetings).toHaveAttribute('aria-selected', 'true')
    fireEvent.click(screen.getByRole('tab', { name: 'Focus' }))
    expect(onChange).toHaveBeenCalledWith('focus')
  })

  it('exposes a day-view shortcut', () => {
    const onDayView = vi.fn()
    render(<TabBar active="overview" onChange={vi.fn()} onDayView={onDayView} />)
    fireEvent.click(screen.getByText('Day view →'))
    expect(onDayView).toHaveBeenCalled()
  })
})

describe('tab rendering (no raw category keys leak)', () => {
  it('Overview renders without raw keys and includes Shallow work in the legend', () => {
    const { container } = render(<OverviewTab {...tabProps} />)
    expect(screen.getByText('Time breakdown')).toBeInTheDocument()
    expect(screen.getAllByText('Shallow work').length).toBeGreaterThan(0)
    expect(container.textContent).not.toMatch(/comms|possible-adhoc/)
  })

  it('Meetings renders without raw keys', () => {
    const { container } = render(<MeetingsTab {...tabProps} />)
    expect(screen.getByText('Back-to-back rate')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/comms|possible-adhoc/)
  })

  it('Focus renders without raw keys', () => {
    const { container } = render(<FocusTab {...tabProps} />)
    expect(screen.getByText('How your focus time is structured')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/comms|possible-adhoc/)
  })

  it('Messaging renders without raw keys', () => {
    const { container } = render(<MessagingTab {...tabProps} />)
    expect(screen.getByText('Message volume by hour')).toBeInTheDocument()
    expect(screen.getByText('Meeting multitasking')).toBeInTheDocument()
    expect(container.textContent).not.toMatch(/comms|possible-adhoc/)
  })
})
