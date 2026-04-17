import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { Employee } from '../db/database'
import { ClientsPage } from './ClientsPage'

const mockUseClients = vi.fn()

vi.mock('../hooks/useClients', () => ({
  useClients: () => mockUseClients(),
}))

const activeProfile: Employee = {
  id: 1,
  name: 'Milan',
  exportRecipient: 'CH Construct',
  exportLogo: '',
  defaultBreakMinutes: 45,
  defaultStartTime: '06:30',
  sortOrder: 0,
  isActive: true,
  createdAt: new Date('2026-04-01T00:00:00.000Z'),
}

describe('ClientsPage', () => {
  beforeEach(() => {
    mockUseClients.mockReturnValue({
      clients: [],
      loading: false,
      createClient: vi.fn().mockResolvedValue(1),
      updateClient: vi.fn().mockResolvedValue(undefined),
      deleteClient: vi.fn().mockResolvedValue(undefined),
    })
  })

  it('shows the empty state when no clients exist', () => {
    render(<ClientsPage activeEmployeeId={1} activeProfiles={[activeProfile]} onSelectEmployee={vi.fn()} />)

    expect(screen.getByText('Nog geen klanten aangemaakt.')).toBeVisible()
  })

  it('creates a new client from the editor sheet', async () => {
    const createClient = vi.fn().mockResolvedValue(2)
    const user = userEvent.setup()

    mockUseClients.mockReturnValue({
      clients: [],
      loading: false,
      createClient,
      updateClient: vi.fn(),
      deleteClient: vi.fn(),
    })

    render(<ClientsPage activeEmployeeId={1} activeProfiles={[activeProfile]} onSelectEmployee={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: '+ Nieuw' }))
    const dialog = await screen.findByRole('dialog', { name: 'Nieuwe klant' })

    await user.type(within(dialog).getByLabelText('Klantnaam'), 'Mathys')
    await user.type(within(dialog).getByLabelText('Standaard locatie'), 'Damme')
    await user.click(within(dialog).getByRole('button', { name: 'Opslaan' }))

    await waitFor(() => {
      expect(createClient).toHaveBeenCalledWith({ name: 'Mathys', defaultLocation: 'Damme' })
    })
  })

  it('confirms before deleting a client', async () => {
    const deleteClient = vi.fn().mockResolvedValue(undefined)
    const user = userEvent.setup()

    mockUseClients.mockReturnValue({
      clients: [
        {
          id: 7,
          name: 'Mathys',
          defaultLocation: 'Damme',
          lastUsedAt: null,
        },
      ],
      loading: false,
      createClient: vi.fn(),
      updateClient: vi.fn(),
      deleteClient,
    })

    render(<ClientsPage activeEmployeeId={1} activeProfiles={[activeProfile]} onSelectEmployee={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Verwijder' }))
    await user.click(await screen.findByRole('button', { name: 'Ja, verwijder' }))

    await waitFor(() => {
      expect(deleteClient).toHaveBeenCalledWith(7)
    })
  })
})
