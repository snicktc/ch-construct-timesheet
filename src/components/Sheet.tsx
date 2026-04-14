import { useEffect, useRef, type ReactNode } from 'react'

type SheetProps = {
  title?: string
  open: boolean
  onClose: () => void
  children: ReactNode
}

export function Sheet({ title, open, onClose, children }: SheetProps) {
  const sheetRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose, open])

  if (!open) {
    return null
  }

  return (
    <div className="sheet-backdrop" role="presentation" onClick={onClose}>
      <section
        ref={sheetRef}
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
