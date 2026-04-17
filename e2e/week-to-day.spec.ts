import { expect, test } from '@playwright/test'

import { ACTIVE_PROFILE_STORAGE_KEY, seedAppState } from './helpers/app-state'
import { formatDateKey, formatShortDate, getFortnightDates } from '../src/utils/weekHelpers'

test('can open a day from the week overview', async ({ page }) => {
  const targetDate = getFortnightDates(new Date())[1]
  const targetDateKey = formatDateKey(targetDate)

  await seedAppState(page, {
    path: '/?tab=week',
    employees: [
      {
        id: 1,
        name: 'Milan',
        exportRecipient: 'CH Construct',
        exportLogo: '',
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
        date: targetDateKey,
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

  await page.locator('.week-day-list button').filter({ hasText: formatShortDate(targetDate) }).first().click()

  await expect(page.getByText(targetDateKey)).toBeVisible()
  await expect(page.getByText('CH Construct - Gent')).toBeVisible()
})
