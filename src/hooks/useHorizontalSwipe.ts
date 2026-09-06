import { useMemo, useRef } from 'react'

type UseHorizontalSwipeOptions = {
  onSwipeLeft: () => void
  onSwipeRight: () => void
  threshold?: number
}

type SwipeStart = {
  x: number
  y: number
}

export function useHorizontalSwipe({
  onSwipeLeft,
  onSwipeRight,
  threshold = 48,
}: UseHorizontalSwipeOptions) {
  const startRef = useRef<SwipeStart | null>(null)

  return useMemo(
    () => ({
      onPointerDown: (event: React.PointerEvent<HTMLElement>) => {
        startRef.current = { x: event.clientX, y: event.clientY }
      },
      onPointerUp: (event: React.PointerEvent<HTMLElement>) => {
        if (startRef.current === null) {
          return
        }

        const deltaX = event.clientX - startRef.current.x
        const deltaY = event.clientY - startRef.current.y
        startRef.current = null

        if (Math.abs(deltaX) < threshold) {
          return
        }

        // Ignore diagonal or mostly vertical gestures (scrolling) so they do
        // not accidentally navigate.
        if (Math.abs(deltaY) >= Math.abs(deltaX)) {
          return
        }

        if (deltaX < 0) {
          onSwipeLeft()
          return
        }

        onSwipeRight()
      },
      onPointerCancel: () => {
        startRef.current = null
      },
    }),
    [onSwipeLeft, onSwipeRight, threshold],
  )
}
