// Wraps any element and reveals a floating Tooltip with `content` on hover,
// keyboard focus, OR tap (toggle on tap, dismiss on tap-away) — the single
// shared hover/tap mechanism used by every widget. Renders the element plain
// when there is no content.

import { useEffect, useRef, useState } from 'react'
import Tooltip from './Tooltip.jsx'

export default function HoverInfo({ content, children, className = '', as: Tag = 'span' }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return () => document.removeEventListener('click', onDoc)
  }, [open])

  if (content == null) {
    return <Tag className={className || undefined}>{children}</Tag>
  }

  return (
    <Tag
      ref={ref}
      className={`hoverinfo ${className}`.trim()}
      tabIndex={0}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
      onClick={(e) => {
        e.stopPropagation()
        setOpen((o) => !o)
      }}
    >
      {children}
      {open && <Tooltip>{content}</Tooltip>}
    </Tag>
  )
}
