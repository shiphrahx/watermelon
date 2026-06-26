import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Card from './Card.jsx'
import HoverInfo from './HoverInfo.jsx'

describe('Card', () => {
  it('renders a title, actions and children', () => {
    render(
      <Card title="My widget" actions={<button>Go</button>}>
        <p>body</p>
      </Card>,
    )
    expect(screen.getByText('My widget')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go' })).toBeInTheDocument()
    expect(screen.getByText('body')).toBeInTheDocument()
  })
})

describe('HoverInfo', () => {
  it('reveals the tooltip on hover and hides on leave', () => {
    render(<HoverInfo content="exact value">visual</HoverInfo>)
    expect(screen.queryByRole('tooltip')).toBeNull()
    fireEvent.mouseEnter(screen.getByText('visual'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('exact value')
    fireEvent.mouseLeave(screen.getByText('visual'))
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('toggles the tooltip on tap (touch fallback) and dismisses on tap-away', () => {
    render(
      <div>
        <HoverInfo content="tap detail">visual</HoverInfo>
        <span>elsewhere</span>
      </div>,
    )
    fireEvent.click(screen.getByText('visual'))
    expect(screen.getByRole('tooltip')).toHaveTextContent('tap detail')
    fireEvent.click(document.body)
    expect(screen.queryByRole('tooltip')).toBeNull()
  })

  it('renders plain when there is no content', () => {
    render(<HoverInfo content={null}>just text</HoverInfo>)
    expect(screen.getByText('just text')).toBeInTheDocument()
    expect(screen.queryByRole('tooltip')).toBeNull()
  })
})
