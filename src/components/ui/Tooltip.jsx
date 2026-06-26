// Small dark floating popover. Rendered by HoverInfo above the hovered element.

export default function Tooltip({ children, className = '' }) {
  return (
    <span className={`tooltip ${className}`.trim()} role="tooltip">
      {children}
      <span className="tooltip__arrow" aria-hidden="true" />
    </span>
  )
}
