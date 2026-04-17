import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { type Employee } from '../db/database'
import { setupTestDb, teardownTestDb } from '../../tests/helpers/dbHelpers'
import { TodayPage } from './TodayPage'

const mockUseClients = vi.fn()
const mockUseTimeEntry = vi.fn()

vi.mock('../hooks/useClients', () => ({
  useClients: () => mockUseClients(),
}))

vi.mock('../hooks/useTimeEntry', () => ({
  useTimeEntry: (...args: unknown[]) => mockUseTimeEntry(...args),
}))

vi.mock('../hooks/useHorizontalSwipe', () => ({
  useHorizontalSwipe: () => ({}),
}))

const activeEmployee: Employee = {
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

describe('TodayPage', () => {
  beforeEach(async () => {
    await setupTestDb()
    vi.spyOn(HTMLElement.prototype, 'scrollIntoView').mockImplementation(() => {})
    mockUseClients.mockReturnValue({
      clients: [{ id: 1, name: 'CH Construct', defaultLocation: 'Gent', lastUsedAt: null }],
      createClient: vi.fn(),
    })
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await teardownTestDb()
  })

  it('shows the inline empty-day flow and repeat card when no entries exist', async () => {
    const repeatPreviousWorkday = vi.fn().mockResolvedValue(undefined)
    mockUseTimeEntry.mockReturnValue({
      entries: [],
      previousWorkdayEntries: [
        {
          id: 1,
          employeeId: 1,
          date: '2026-04-16',
          sortOrder: 0,
          clientId: 1,
          clientName: 'CH Construct',
          location: 'Gent',
          startTime: '06:30',
          endTime: '15:30',
          breakMinutes: 45,
          travelCreditMinutes: 0,
          isDriver: 'Ja',
          notes: '',
        },
      ],
      loading: false,
      dayTotalMinutes: 0,
      repeatPreviousWorkday,
      createEntry: vi.fn(),
      updateEntry: vi.fn(),
      deleteEntry: vi.fn(),
    })
    const onDateConsumed = vi.fn()
    const user = userEvent.setup()

    render(
      <TodayPage
        activeEmployee={activeEmployee}
        activeEmployeeId={1}
        activeProfiles={[activeEmployee]}
        onSelectEmployee={vi.fn()}
        initialDate={new Date('2026-04-17T00:00:00.000Z')}
        onDateConsumed={onDateConsumed}
        openedFromWeek
        highlightRepeatCard
      />,
    )

    expect(await screen.findByText('Zelfde als gisteren?')).toBeVisible()
    expect(screen.getByText('Voeg hieronder meteen uren toe voor deze dag.')).toBeVisible()

    await user.click(screen.getByRole('button', { name: /Zelfde als gisteren/i }))

    await waitFor(() => {
      expect(repeatPreviousWorkday).toHaveBeenCalledWith('2026-04-17')
    })
    expect(onDateConsumed).toHaveBeenCalled()
  })

  it('opens the edit sheet for an existing entry and supports day navigation', async () => {
    mockUseTimeEntry.mockReturnValue({
      entries: [
        {
          id: 10,
          employeeId: 1,
          date: '2026-04-17',
          sortOrder: 0,
          clientId: 1,
          clientName: 'CH Construct',
          location: 'Gent',
          startTime: '06:30',
          endTime: '15:30',
          breakMinutes: 45,
          travelCreditMinutes: 0,
          isDriver: 'Ja',
          notes: 'Werf',
        },
      ],
      previousWorkdayEntries: [],
      loading: false,
      dayTotalMinutes: 495,
      repeatPreviousWorkday: vi.fn(),
      createEntry: vi.fn(),
      updateEntry: vi.fn(),
      deleteEntry: vi.fn(),
    })
    const user = userEvent.setup()

    render(
      <TodayPage
        activeEmployee={activeEmployee}
        activeEmployeeId={1}
        activeProfiles={[activeEmployee]}
        onSelectEmployee={vi.fn()}
        initialDate={new Date('2026-04-17T00:00:00.000Z')}
      />,
    )

    expect(await screen.findByText('CH Construct - Gent')).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Bewerk registratie' }))
    expect(await screen.findByRole('dialog', { name: 'Uren bewerken' })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Vorige dag' }))
    expect(await screen.findByText('2026-04-16')).toBeVisible()
  })
})
