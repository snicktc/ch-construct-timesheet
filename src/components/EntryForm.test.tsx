import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createTimeEntryRecord, db, type Employee } from '../db/database'
import { setupTestDb, teardownTestDb } from '../../tests/helpers/dbHelpers'
import { EntryForm } from './EntryForm'

const employee: Employee = {
  id: 1,
  name: 'Milan',
  exportRecipient: 'CH Construct',
  defaultBreakMinutes: 45,
  defaultStartTime: '06:30',
  sortOrder: 0,
  isActive: true,
  createdAt: new Date('2026-04-01T00:00:00.000Z'),
}

describe('EntryForm', () => {
  beforeEach(async () => {
    await setupTestDb()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  it('validates that a client is required', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <EntryForm
        employee={employee}
        clients={[]}
        dayEntries={[]}
        onSubmit={onSubmit}
        onCreateClient={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Opslaan' }))

    expect(await screen.findByText('Klant is verplicht.')).toBeVisible()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('asks confirmation before saving overlapping hours', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <EntryForm
        employee={employee}
        clients={[{ id: 1, name: 'CH Construct', defaultLocation: 'Gent', lastUsedAt: null }]}
        dayEntries={[
          createTimeEntryRecord({
            employeeId: 1,
            date: '2026-04-17',
            sortOrder: 0,
            clientId: 1,
            clientName: 'CH Construct',
            location: 'Gent',
            startTime: '08:00',
            endTime: '12:00',
          }),
        ]}
        suggestedStartTime="09:00"
        onSubmit={onSubmit}
        onCreateClient={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Opslaan' }))

    expect(await screen.findByRole('dialog', { name: 'Uren overlappen' })).toBeVisible()
    expect(onSubmit).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Ja, toch opslaan' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
  })

  it('can create a new client inline and submit with the new client id', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    const onCreateClient = vi.fn().mockImplementation(async () => 42)

    render(
      <EntryForm
        employee={employee}
        clients={[]}
        dayEntries={[]}
        onSubmit={onSubmit}
        onCreateClient={onCreateClient}
        onCancel={vi.fn()}
      />,
    )

    await user.click(screen.getByPlaceholderText('Zoek klant'))
    await user.click(screen.getByRole('button', { name: '+ Nieuwe klant' }))
    const newClientField = screen.getByText('Nieuwe klantnaam').closest('.field') as HTMLElement | null
    const newLocationField = screen.getByText('Standaard locatie').closest('.field') as HTMLElement | null

    if (!newClientField || !newLocationField) {
      throw new Error('Expected inline new client fields to be visible')
    }

    await user.type(within(newClientField).getByRole('textbox'), 'Nieuwe klant')
    await user.type(within(newLocationField).getByRole('textbox'), 'Antwerpen')
    await user.click(screen.getByRole('button', { name: 'Klant opslaan' }))

    expect(onCreateClient).toHaveBeenCalledWith({ name: 'Nieuwe klant', defaultLocation: 'Antwerpen' })

    await db.locations.add({ name: 'Antwerpen' })
    await user.click(screen.getByRole('button', { name: 'Opslaan' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          clientId: 42,
          location: 'Antwerpen',
        }),
      )
    })
  })

  it('shows an error and keeps the inline panel open when creating a client fails', async () => {
    const user = userEvent.setup()
    // Vitest fails the run on any unhandled rejection, so reaching the
    // assertions below also proves the rejection was handled by the form.
    const onCreateClient = vi.fn().mockRejectedValue(new Error('Klant bestaat al.'))

    render(
      <EntryForm
        employee={employee}
        clients={[]}
        dayEntries={[]}
        onSubmit={vi.fn()}
        onCreateClient={onCreateClient}
        onCancel={vi.fn()}
      />,
    )

    await user.click(screen.getByPlaceholderText('Zoek klant'))
    await user.click(screen.getByRole('button', { name: '+ Nieuwe klant' }))
    const newClientField = screen.getByText('Nieuwe klantnaam').closest('.field') as HTMLElement
    const newLocationField = screen.getByText('Standaard locatie').closest('.field') as HTMLElement

    await user.type(within(newClientField).getByRole('textbox'), 'Dubbel')
    await user.type(within(newLocationField).getByRole('textbox'), 'Gent')
    await user.click(screen.getByRole('button', { name: 'Klant opslaan' }))

    expect(await screen.findByText('Klant bestaat al.')).toBeVisible()
    // Input is preserved so the user can correct it.
    expect(within(newClientField).getByRole('textbox')).toHaveValue('Dubbel')
    expect(screen.getByRole('button', { name: 'Klant opslaan' })).toBeEnabled()
  })

  it('rejects an end time that is not later than the start time', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <EntryForm
        employee={employee}
        clients={[{ id: 1, name: 'CH Construct', defaultLocation: 'Gent', lastUsedAt: null }]}
        dayEntries={[]}
        suggestedStartTime="17:00"
        onSubmit={onSubmit}
        onCreateClient={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    // Default end time is 17:00, equal to the suggested start time.
    await user.click(screen.getByRole('button', { name: 'Opslaan' }))

    expect(await screen.findByText('Eindtijd moet later zijn dan starttijd.')).toBeVisible()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects a break plus travel credit that consumes the whole shift', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)

    render(
      <EntryForm
        employee={employee}
        clients={[{ id: 1, name: 'CH Construct', defaultLocation: 'Gent', lastUsedAt: null }]}
        dayEntries={[]}
        suggestedStartTime="16:00"
        defaultBreakMinutes={45}
        onSubmit={onSubmit}
        onCreateClient={vi.fn()}
        onCancel={vi.fn()}
      />,
    )

    // 16:00-17:00 = 60 min gross; 45 min break + 15 min travel credit = 60 min.
    await user.click(screen.getByRole('button', { name: /Meer opties/ }))
    const travelField = screen.getByText('Rit-credit (min)').closest('.field') as HTMLElement
    const travelInput = within(travelField).getByRole('spinbutton')
    await user.clear(travelInput)
    await user.type(travelInput, '15')

    await user.click(screen.getByRole('button', { name: 'Opslaan' }))

    expect(
      await screen.findByText('Pauze en rit-credit zijn samen groter dan of gelijk aan de gewerkte tijd.'),
    ).toBeVisible()
    expect(onSubmit).not.toHaveBeenCalled()

    // Lowering the break makes the entry valid again.
    await user.click(screen.getByRole('button', { name: '0 min' }))
    await user.click(screen.getByRole('button', { name: 'Opslaan' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ startTime: '16:00', endTime: '17:00', breakMinutes: 0, travelCreditMinutes: 15 }),
      )
    })
  })
})
