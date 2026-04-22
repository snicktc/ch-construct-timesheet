import { expect, test } from '@playwright/test'

import { ACTIVE_PROFILE_STORAGE_KEY, seedAppState } from './helpers/app-state'
import { addDays, formatDateKey } from '../src/utils/weekHelpers'

test('can repeat the previous workday', async ({ page }) => {
  const today = new Date()
  const yesterday = addDays(today, -1)

  await seedAppState(page, {
    employees: [
      {
        id: 1,
        name: 'Milan',
        exportRecipient: 'CH Construct',
        defaultBreakMinutes: 45,
        defaultStartTime: '06:30',
        sortOrder: 0,
        isActive: true,
        createdAt: '2026-04-01T00:00:00.000Z',
      },
    ],
    clients: [
      {
        id: 1,
        name: 'CH Construct',
        defaultLocation: 'Gent',
        lastUsedAt: null,
      },
    ],
    locations: [{ id: 1, name: 'Gent' }],
    timeEntries: [
      {
        id: 1,
        employeeId: 1,
        date: formatDateKey(yesterday),
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
    localStorage: {
      [ACTIVE_PROFILE_STORAGE_KEY]: '1',
    },
  })

  await expect(page.getByText('Zelfde als gisteren?')).toBeVisible()
  await page.getByRole('button', { name: /Zelfde als gisteren/i }).click()

  await expect(page.getByText('Opgeslagen.')).toBeVisible()
  await expect(page.getByText('CH Construct - Gent')).toBeVisible()
})
