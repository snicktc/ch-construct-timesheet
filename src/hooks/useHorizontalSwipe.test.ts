import { renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { useHorizontalSwipe } from './useHorizontalSwipe'

const pointer = (clientX: number, clientY = 0) => ({ clientX, clientY }) as React.PointerEvent<HTMLElement>

describe('useHorizontalSwipe', () => {
  it('triggers swipe left when pointer delta exceeds threshold to the left', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useHorizontalSwipe({ onSwipeLeft, onSwipeRight }))

    result.current.onPointerDown(pointer(100, 200))
    result.current.onPointerUp(pointer(20, 205))

    expect(onSwipeLeft).toHaveBeenCalledTimes(1)
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('triggers swipe right and resets on cancel', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useHorizontalSwipe({ onSwipeLeft, onSwipeRight, threshold: 10 }))

    result.current.onPointerDown(pointer(10))
    result.current.onPointerCancel()
    result.current.onPointerUp(pointer(40))
    expect(onSwipeRight).not.toHaveBeenCalled()

    result.current.onPointerDown(pointer(10))
    result.current.onPointerUp(pointer(40))
    expect(onSwipeRight).toHaveBeenCalledTimes(1)
    expect(onSwipeLeft).not.toHaveBeenCalled()
  })

  it('ignores gestures below the horizontal threshold', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useHorizontalSwipe({ onSwipeLeft, onSwipeRight }))

    result.current.onPointerDown(pointer(100))
    result.current.onPointerUp(pointer(60))

    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('ignores diagonal and vertical gestures such as scrolling', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useHorizontalSwipe({ onSwipeLeft, onSwipeRight }))

    // Diagonal: horizontal delta passes the threshold but vertical is larger.
    result.current.onPointerDown(pointer(100, 100))
    result.current.onPointerUp(pointer(40, 190))

    // Purely vertical scroll with slight horizontal drift.
    result.current.onPointerDown(pointer(100, 100))
    result.current.onPointerUp(pointer(50, 300))

    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
  })

  it('ignores pointer up without a preceding pointer down', () => {
    const onSwipeLeft = vi.fn()
    const onSwipeRight = vi.fn()
    const { result } = renderHook(() => useHorizontalSwipe({ onSwipeLeft, onSwipeRight }))

    result.current.onPointerUp(pointer(200))

    expect(onSwipeLeft).not.toHaveBeenCalled()
    expect(onSwipeRight).not.toHaveBeenCalled()
  })
})
