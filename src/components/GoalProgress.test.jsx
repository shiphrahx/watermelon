import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import GoalProgress from './GoalProgress.jsx'

describe('GoalProgress', () => {
  it('renders nothing without a goal', () => {
    const { container } = render(<GoalProgress progress={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows the percentage, pace state, and caption', () => {
    render(<GoalProgress progress={{ goalMinutes: 900, focusMinutes: 810, pct: 90, state: 'On track' }} />)
    expect(screen.getByText('90%')).toBeInTheDocument()
    expect(screen.getByText('On track')).toBeInTheDocument()
    expect(screen.getByText('13h 30m of 15h')).toBeInTheDocument()
  })

  it('handles an exceeded goal', () => {
    render(<GoalProgress progress={{ goalMinutes: 900, focusMinutes: 1200, pct: 133, state: 'Exceeded' }} />)
    expect(screen.getByText('133%')).toBeInTheDocument()
    expect(screen.getByText('Exceeded')).toBeInTheDocument()
  })
})
