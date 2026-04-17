import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { ClientSelect } from './ClientSelect'

const clients = [
  { id: 1, name: 'Alpha Project', defaultLocation: 'Gent', lastUsedAt: null },
  { id: 2, name: 'Beta Project', defaultLocation: 'Brugge', lastUsedAt: null },
]

describe('ClientSelect', () => {
  it('clears the visible query when focusing an existing selection', async () => {
    render(
      <ClientSelect clients={clients} value={1} onChange={vi.fn()} onCreateNew={vi.fn()} />,
    )

    const input = screen.getByPlaceholderText('Zoek klant') as HTMLInputElement
    expect(input.value).toBe('Alpha Project')

    fireEvent.focus(input)

    expect(input.value).toBe('')
  })

  it('filters and selects a client from the autocomplete list', async () => {
    const onChange = vi.fn()
    const user = userEvent.setup()

    render(
      <ClientSelect clients={clients} value={1} onChange={onChange} onCreateNew={vi.fn()} />,
    )

    const input = screen.getByPlaceholderText('Zoek klant')
    await user.click(input)
    await user.type(input, 'Beta')
    await user.click(screen.getByRole('button', { name: /Beta Project/i }))

    expect(onChange).toHaveBeenCalledWith(2)
  })

  it('offers a create-new action while editing', async () => {
    const onCreateNew = vi.fn()
    const user = userEvent.setup()

    render(
      <ClientSelect clients={clients} value={null} onChange={vi.fn()} onCreateNew={onCreateNew} />,
    )

    await user.click(screen.getByPlaceholderText('Zoek klant'))
    await user.click(screen.getByRole('button', { name: '+ Nieuwe klant' }))

    expect(onCreateNew).toHaveBeenCalledTimes(1)
  })
})
