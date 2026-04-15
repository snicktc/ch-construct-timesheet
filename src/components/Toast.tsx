import { memo } from 'react'

type ToastProps = {
  message: string
  tone: 'success' | 'error'
}

function ToastComponent({ message, tone }: ToastProps) {
  return <div className={`toast toast-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>{message}</div>
}

export const Toast = memo(ToastComponent)
