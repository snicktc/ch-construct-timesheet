import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useHorizontalSwipe } from './useHorizontalSwipe'

describe('useHorizontalSwipe', () => {
  it('triggers swipe left when pointer delta exceeds threshold to the left', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useHorizontalSwipe({ onSwipeLeft, onSwipeRight }))

    result.current.onPointerDown({ clientX: 100 } as React.PointerEvent<HTMLElement>)
    result.current.onPointerUp({ clientX: 20 } as React.PointerEvent<HTMLElement>)

    expect(onSwipeLeft).toHaveBeenCalledTimes(1)
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('triggers swipe right and resets on cancel', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useHorizontalSwipe({ onSwipeLeft, onSwipeRight, threshold: 10 }))

    result.current.onPointerDown({ clientX: 10 } as React.PointerEvent<HTMLElement>)
    result.current.onPointerCancel()
    result.current.onPointerUp({ clientX: 40 } as React.PointerEvent<HTMLElement>)
    expect(onSwipeRight).not.toHaveBeenCalled()

    result.current.onPointerDown({ clientX: 10 } as React.PointerEvent<HTMLElement>)
    result.current.onPointerUp({ clientX: 40 } as React.PointerEvent<HTMLElement>)
    expect(onSwipeRight).toHaveBeenCalledTimes(1)
    expect(onSwipeLeft).not.toHaveBeenCalled()
  })
})
