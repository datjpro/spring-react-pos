import { type ReactNode } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'

export interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'warning' | 'primary'
  loading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Xác nhận',
  cancelLabel = 'Hủy',
  variant = 'primary',
  loading = false
}: ConfirmDialogProps) {
  const getButtonVariant = () => {
    switch (variant) {
      case 'danger': return 'danger'
      case 'warning': return 'secondary' // Using secondary for warning since we don't have a specific warning variant in Button
      default: return 'primary'
    }
  }

  const footer = (
    <>
      <Button variant="ghost" onClick={onClose} disabled={loading}>
        {cancelLabel}
      </Button>
      <Button variant={getButtonVariant()} onClick={onConfirm} disabled={loading}>
        {loading ? 'Đang xử lý...' : confirmLabel}
      </Button>
    </>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} footer={footer} maxWidth="400px">
      <p style={{ margin: 0, color: 'var(--text-muted)' }}>{message}</p>
    </Modal>
  )
}
