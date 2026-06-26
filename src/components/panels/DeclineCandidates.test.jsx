import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import DeclineCandidates from './DeclineCandidates.jsx'

describe('DeclineCandidates', () => {
  it('lists flagged meetings with framing copy', () => {
    render(
      <DeclineCandidates
        candidates={[{ title: 'Daily standup', avgMessages: 4.6, occurrences: 8 }]}
      />,
    )
    expect(screen.getByText(/frequently messaging during these meetings/)).toBeInTheDocument()
    expect(screen.getByText('Daily standup')).toBeInTheDocument()
    expect(screen.getByText(/5 msgs\/occurrence · 8×/)).toBeInTheDocument()
  })

  it('shows a positive empty state when none qualify', () => {
    render(<DeclineCandidates candidates={[]} />)
    expect(screen.getByText(/No meetings stand out as multitasking-heavy/)).toBeInTheDocument()
  })
})
