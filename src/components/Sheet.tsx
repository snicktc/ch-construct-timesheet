import type { ReactNode } from 'react'

type SheetProps = {
  title?: string
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Sheet({ title, open, onClose, children }: SheetProps) {
  if (!open) {
    return null
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="sheet-handle" aria-hidden="true" />
        {children}
      </section>
    </div>
  )
}
