// Inline error state with a retry button.

export default function ErrorState({ message, onRetry }) {
  return (
    <div className="panel">
      <p className="status status--error">{message}</p>
      {onRetry && (
        <button onClick={onRetry}>Retry</button>
      )}
    </div>
  )
}
