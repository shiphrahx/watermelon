// Base surface for every widget. Optional title + right-aligned actions slot.
// Variants: `pad` (default true) and `className` for layout (e.g. span widths).

export default function Card({ title, actions, className = '', pad = true, children }) {
  return (
    <section className={`uicard${pad ? '' : ' uicard--flush'} ${className}`.trim()}>
      {(title || actions) && (
        <header className="uicard__head">
          {title && <h2 className="uicard__title">{title}</h2>}
          {actions && <div className="uicard__actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  )
}
