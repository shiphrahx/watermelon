import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import DeclineCandidates from './DeclineCandidates.jsx'

describe('DeclineCandidates', () => {
  it('shows flagged meetings as pills with detail on hover', () => {
    render(<DeclineCandidates candidates={[{ title: 'Daily standup', avgMessages: 4.6, occurrences: 8 }]} />)
    expect(screen.getByText('Daily standup')).toBeInTheDocument()
    // per-item detail is not permanently on the card
    expect(screen.queryByText(/5 msgs\/occurrence/)).toBeNull()
    fireEvent.mouseEnter(screen.getByText('Daily standup'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('5 msgs/occurrence over 8 occurrences')
  })

  it('shows a positive empty state when none qualify', () => {
    render(<DeclineCandidates candidates={[]} />)
    expect(screen.getByText(/No meetings stand out as multitasking-heavy/)).toBeInTheDocument()
  })
})
