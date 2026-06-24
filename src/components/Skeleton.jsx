// Skeleton placeholders that match the shape of the content they replace.

export function SkeletonBlock({ className = '', style }) {
  return <div className={`skeleton ${className}`} style={style} aria-hidden="true" />
}

export function SkeletonCards({ count = 5 }) {
  return (
    <div className="insight-cards" aria-busy="true">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBlock key={i} className="skeleton-card" />
      ))}
    </div>
  )
}

// A panel-shaped skeleton: a heading line plus a few content lines.
export function SkeletonPanel({ lines = 5 }) {
  return (
    <div className="panel" aria-busy="true">
      <SkeletonBlock className="skeleton-line" style={{ width: '40%', height: 18 }} />
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonBlock key={i} className="skeleton-line" style={{ width: `${90 - i * 8}%` }} />
      ))}
    </div>
  )
}
