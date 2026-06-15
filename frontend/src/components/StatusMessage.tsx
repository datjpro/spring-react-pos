import { AlertCircle, CheckCircle2, Info } from 'lucide-react'

type Tone = 'default' | 'success' | 'error'

type StatusMessageProps = {
  message: string
  tone?: Tone
}

export function StatusMessage({ message, tone = 'default' }: StatusMessageProps) {
  const icon = tone === 'success' ? <CheckCircle2 size={16} /> : tone === 'error' ? <AlertCircle size={16} /> : <Info size={16} />
  const className = tone === 'success' ? 'status-banner status-banner--success' : tone === 'error' ? 'status-banner status-banner--error' : 'status-banner'

  return (
    <div className={className}>
      {icon}
      <span>{message}</span>
    </div>
  )
}
