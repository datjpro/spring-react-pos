import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { useToast, type ToastMessage } from '../../store/toast'

export function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="toast-container" style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onRemove={() => removeToast(toast.id)} />
      ))}
    </div>
  )
}

function ToastItem({ toast, onRemove }: { toast: ToastMessage, onRemove: () => void }) {
  const icons = {
    success: <CheckCircle2 size={18} />,
    error: <AlertCircle size={18} />,
    info: <Info size={18} />
  }

  return (
    <div 
      className={`toast toast--${toast.type}`}
      style={{
        pointerEvents: 'auto',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '12px 16px',
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: '12px',
        boxShadow: 'var(--shadow)',
        minWidth: '300px',
        maxWidth: '400px',
        animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        ...(toast.type === 'success' && { borderColor: 'rgba(16, 185, 129, 0.35)', color: '#86efac' }),
        ...(toast.type === 'error' && { borderColor: 'rgba(239, 68, 68, 0.35)', color: '#fca5a5' }),
      }}
    >
      <div style={{ flexShrink: 0 }}>
        {icons[toast.type]}
      </div>
      <p style={{ margin: 0, fontSize: '0.9rem', flexGrow: 1, color: 'var(--text)' }}>
        {toast.message}
      </p>
      <button 
        type="button" 
        onClick={onRemove}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--text-muted)',
          cursor: 'pointer',
          padding: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <X size={16} />
      </button>
    </div>
  )
}
