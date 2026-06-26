// Dashboard tab bar with a "Day view →" shortcut pinned to the right.

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'focus', label: 'Focus' },
  { id: 'messaging', label: 'Messaging' },
  { id: 'trends', label: 'Trends' },
]

export default function TabBar({ active, onChange, onDayView }) {
  return (
    <div className="tab-bar">
      <div className="tab-bar__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={active === t.id}
            className={`tab${active === t.id ? ' tab--active' : ''}`}
            onClick={() => onChange(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      {onDayView && (
        <button className="tab-bar__dayview" onClick={onDayView}>
          Day view →
        </button>
      )}
    </div>
  )
}

export { TABS }
