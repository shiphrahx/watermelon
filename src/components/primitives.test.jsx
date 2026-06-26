import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import CategoryLegend from './CategoryLegend.jsx'
import HBarChart from './charts/HBarChart.jsx'
import { SkeletonBlock, SkeletonCards, SkeletonPanel } from './Skeleton.jsx'
import ErrorState from './ErrorState.jsx'
import Panel from './Panel.jsx'
import { CATEGORIES, CATEGORY_LABELS } from '../analysis/classify.js'

describe('CategoryLegend', () => {
  it('lists every active category by display name (incl. Shallow work, no ad-hoc)', () => {
    render(<CategoryLegend />)
    for (const cat of CATEGORIES) {
      expect(screen.getByText(CATEGORY_LABELS[cat])).toBeInTheDocument()
    }
    expect(screen.getByText('Shallow work')).toBeInTheDocument()
    expect(screen.queryByText(/Likely unscheduled/)).toBeNull()
  })
})

describe('HBarChart', () => {
  const rows = [
    { key: 'a', label: 'Alpha', value: '3h', fillRatio: 1, color: '#111' },
    { key: 'b', label: 'Beta', value: '1h', fillRatio: 0.33, color: '#222', bold: true },
  ]

  it('renders a row per item with label and value', () => {
    render(<HBarChart rows={rows} />)
    expect(screen.getByText('Alpha')).toBeInTheDocument()
    expect(screen.getByText('3h')).toBeInTheDocument()
    expect(screen.getByText('Beta')).toBeInTheDocument()
  })

  it('renders a clickable label when onClick is provided', () => {
    const onClick = vi.fn()
    render(<HBarChart rows={[{ ...rows[0], onClick }]} />)
    fireEvent.click(screen.getByRole('button', { name: 'Alpha' }))
    expect(onClick).toHaveBeenCalled()
  })

  it('clamps fill ratio into 0..100%', () => {
    const { container } = render(
      <HBarChart rows={[{ key: 'x', label: 'X', value: '', fillRatio: 5, color: '#000' }]} />,
    )
    expect(container.querySelector('.hbar-fill').style.width).toBe('100%')
  })
})

describe('Skeleton', () => {
  it('SkeletonCards renders the requested number of cards', () => {
    const { container } = render(<SkeletonCards count={5} />)
    expect(container.querySelectorAll('.skeleton-card')).toHaveLength(5)
  })
  it('SkeletonPanel renders heading + content lines', () => {
    const { container } = render(<SkeletonPanel lines={4} />)
    // 1 heading line + 4 content lines
    expect(container.querySelectorAll('.skeleton-line')).toHaveLength(5)
  })
  it('SkeletonBlock applies a custom class and style', () => {
    const { container } = render(<SkeletonBlock className="x" style={{ width: 10 }} />)
    expect(container.querySelector('.skeleton.x')).toBeInTheDocument()
  })
})

describe('ErrorState', () => {
  it('shows the message and triggers retry', () => {
    const onRetry = vi.fn()
    render(<ErrorState message="Couldn't load this data." onRetry={onRetry} />)
    expect(screen.getByText("Couldn't load this data.")).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }))
    expect(onRetry).toHaveBeenCalled()
  })
  it('omits the retry button when no handler is given', () => {
    render(<ErrorState message="Oops" />)
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull()
  })
})

describe('Panel', () => {
  it('renders title, hint and children', () => {
    render(
      <Panel title="My panel" hint="a hint">
        <div>child content</div>
      </Panel>,
    )
    expect(screen.getByText('My panel')).toBeInTheDocument()
    expect(screen.getByText('a hint')).toBeInTheDocument()
    expect(screen.getByText('child content')).toBeInTheDocument()
  })

  it('shows the empty message instead of children when empty', () => {
    render(
      <Panel title="P" isEmpty emptyMessage="Nothing here">
        <div>should not show</div>
      </Panel>,
    )
    expect(screen.getByText('Nothing here')).toBeInTheDocument()
    expect(screen.queryByText('should not show')).toBeNull()
  })
})
