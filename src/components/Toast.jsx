import './Toast.css';

export default function Toast({ message, actionLabel, onAction, onDismiss }) {
  if (!message) return null;

  return (
    <div className="toast" role="status" aria-live="polite">
      <span>{message}</span>
      {actionLabel && (
        <button type="button" className="toast-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
      <button type="button" className="toast-close" onClick={onDismiss} aria-label="Close">
        ×
      </button>
    </div>
  );
}
