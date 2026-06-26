import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RecurringMeetingCost from './RecurringMeetingCost.jsx'

describe('RecurringMeetingCost', () => {
  it('lists recurring meetings with total/occurrences/avg and a prompt', () => {
    render(
      <RecurringMeetingCost
        audit={{
          items: [
            { title: 'Weekly standup', totalMinutes: 240, occurrences: 8, averageMinutes: 30 },
            { title: 'Sprint planning', totalMinutes: 150, occurrences: 3, averageMinutes: 50 },
          ],
          mostExpensive: { title: 'Weekly standup', totalMinutes: 240, occurrences: 8, averageMinutes: 30 },
        }}
      />,
    )
    expect(screen.getByText('Weekly standup')).toBeInTheDocument()
    expect(screen.getByText(/4h · 8× · 30m avg/)).toBeInTheDocument()
    expect(screen.getByText(/You've spent 4h in “Weekly standup”\. Worth a look\?/)).toBeInTheDocument()
  })

  it('shows an empty state with no recurring meetings', () => {
    render(<RecurringMeetingCost audit={{ items: [], mostExpensive: null }} />)
    expect(screen.getByText(/No recurring meetings found yet/)).toBeInTheDocument()
  })
})
