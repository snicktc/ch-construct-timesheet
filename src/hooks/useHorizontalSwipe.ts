import { useMemo, useRef } from 'react'

type UseHorizontalSwipeOptions = {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  threshold?: number
}

export function useHorizontalSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 48,
}: UseHorizontalSwipeOptions) {
  const startXRef = useRef<number | null>(null)

  return useMemo(
    () => ({
      onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
        startXRef.current = event.clientX
      },
      onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
        if (startXRef.current === null) {
          return
        }

        const deltaX = event.clientX - startXRef.current
        startXRef.current = null

        if (Math.abs(deltaX) < threshold) {
          return
        }

        if (deltaX < 0) {
          onSwipeLeft()
          return
        }

        onSwipeRight()
      },
      onPointerCancel: () => {
        startXRef.current = null
      },
    }),
    [onSwipeLeft, onSwipeRight, threshold],
  )
}
