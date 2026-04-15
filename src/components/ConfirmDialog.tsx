import { memo } from 'react'

import { Sheet } from './Sheet'

type ConfirmDialogProps = {
  open: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

function ConfirmDialogComponent({
  open,
  title,
  message,
  confirmLabel = 'Bevestigen',
  cancelLabel = 'Annuleren',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Sheet open={open} onClose={onCancel} title={title}>
      <div className="confirm-dialog">
        <h2>{title}</h2>
        <p className="muted-text">{message}</p>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={tone === 'danger' ? 'danger-button' : 'primary-button'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Sheet>
  )
}

export const ConfirmDialog = memo(ConfirmDialogComponent)
