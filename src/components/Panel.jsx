// Generic dashboard panel: title, optional hint, and an empty-state fallback.

export default function Panel({ title, hint, wide, isEmpty, emptyMessage, children }) {
  return (
    <section className={`panel${wide ? ' panel--wide' : ''}`}>
      <h2>{title}</h2>
      {hint && <p className="panel__hint">{hint}</p>}
      {isEmpty ? (
        <p className="panel__empty">{emptyMessage}</p>
      ) : (
        children
      )}
    </section>
  )
}
