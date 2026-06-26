import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import GoalProgress from './GoalProgress.jsx'

describe('GoalProgress', () => {
  it('renders nothing without a goal', () => {
    const { container } = render(<GoalProgress progress={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('shows progress caption and state', () => {
    render(<GoalProgress progress={{ goalMinutes: 900, focusMinutes: 810, pct: 90, state: 'On track' }} />)
    expect(screen.getByText(/13h 30m of 15h goal — 90%/)).toBeInTheDocument()
    expect(screen.getByText('On track')).toBeInTheDocument()
  })

  it('caps the bar fill at 100% when exceeded', () => {
    const { container } = render(
      <GoalProgress progress={{ goalMinutes: 900, focusMinutes: 1200, pct: 133, state: 'Exceeded' }} />,
    )
    expect(container.querySelector('.goal__fill').style.width).toBe('100%')
  })
})
