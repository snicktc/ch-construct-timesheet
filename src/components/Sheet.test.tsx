import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { Sheet } from './Sheet'

describe('Sheet', () => {
  it('renders nothing when closed', () => {
    render(
      <Sheet open={false} onClose={vi.fn()} title="Test">
        <p>Inhoud</p>
      </Sheet>,
    )

    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('closes on backdrop click but not on clicks inside the dialog', () => {
    const onClose = vi.fn()

    render(
      <Sheet open onClose={onClose} title="Test">
        <button type="button">Binnen</button>
      </Sheet>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Binnen' }))
    expect(onClose).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('presentation'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('closes on Escape', () => {
    const onClose = vi.fn()

    render(
      <Sheet open onClose={onClose} title="Test">
        <p>Inhoud</p>
      </Sheet>,
    )

    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not let pointer events inside the dialog bubble to swipe handlers on ancestors', () => {
    const onPointerDown = vi.fn()
    const onPointerUp = vi.fn()
    const onPointerCancel = vi.fn()

    render(
      <section onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
        <Sheet open onClose={vi.fn()} title="Test">
          <input aria-label="Notities" />
        </Sheet>
      </section>,
    )

    const input = screen.getByLabelText('Notities')

    fireEvent.pointerDown(input, { clientX: 10, clientY: 10 })
    fireEvent.pointerUp(input, { clientX: 200, clientY: 12 })
    fireEvent.pointerCancel(input)

    expect(onPointerDown).not.toHaveBeenCalled()
    expect(onPointerUp).not.toHaveBeenCalled()
    expect(onPointerCancel).not.toHaveBeenCalled()
  })

  it('still lets pointer events on the backdrop reach ancestors', () => {
    const onPointerUp = vi.fn()

    render(
      <section onPointerUp={onPointerUp}>
        <Sheet open onClose={vi.fn()} title="Test">
          <p>Inhoud</p>
        </Sheet>
      </section>,
    )

    fireEvent.pointerUp(screen.getByRole('presentation'), { clientX: 200, clientY: 12 })

    expect(onPointerUp).toHaveBeenCalledTimes(1)
  })
})
