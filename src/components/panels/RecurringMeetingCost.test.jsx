import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import RecurringMeetingCost from './RecurringMeetingCost.jsx'

describe('RecurringMeetingCost', () => {
  const audit = {
    items: [
      { title: 'Weekly standup', totalMinutes: 240, occurrences: 8, averageMinutes: 30 },
      { title: 'Sprint planning', totalMinutes: 150, occurrences: 3, averageMinutes: 50 },
    ],
    mostExpensive: { title: 'Weekly standup', totalMinutes: 240, occurrences: 8, averageMinutes: 30 },
  }

  it('shows titles + bars at rest and totals on hover, with a most-expensive note', () => {
    const { container } = render(<RecurringMeetingCost audit={audit} />)
    expect(screen.getByText('Weekly standup')).toBeInTheDocument()
    // detail not permanently visible
    expect(screen.queryByText(/8 occurrences/)).toBeNull()
    fireEvent.mouseEnter(container.querySelector('.recurring-row'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('4h total · 8 occurrences · 30m avg')
    expect(screen.getByText(/Most: “Weekly standup” — 4h/)).toBeInTheDocument()
  })

  it('shows an empty state with no recurring meetings', () => {
    render(<RecurringMeetingCost audit={{ items: [], mostExpensive: null }} />)
    expect(screen.getByText(/No recurring meetings found yet/)).toBeInTheDocument()
  })
})
