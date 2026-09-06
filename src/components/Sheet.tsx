import { memo, useCallback, useEffect, useRef, type ReactNode } from 'react'

type SheetProps = {
  title?: string
  open: boolean
  onClose: () => void
  children: ReactNode
}

function SheetComponent({ title, open, onClose, children }: SheetProps) {
  const handleBackdropClick = useCallback(() => {
    onClose()
  }, [onClose])

  // Stop clicks (backdrop close) and pointer events (page-level swipe
  // navigation) from bubbling out of the dialog. Otherwise a horizontal drag
  // inside the form, e.g. selecting text, would switch the day and discard the
  // user's input.
  const handleStopPropagation = useCallback((event: React.SyntheticEvent) => {
    event.stopPropagation()
  }, [])
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
    <div className="sheet-backdrop" role="presentation" onClick={handleBackdropClick}>
      <section
        ref={sheetRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={handleStopPropagation}
        onPointerDown={handleStopPropagation}
        onPointerUp={handleStopPropagation}
        onPointerCancel={handleStopPropagation}
      >
        <div className="sheet-handle" aria-hidden="true" />
        {children}
      </section>
    </div>
  )
}

export const Sheet = memo(SheetComponent)
