import { expect, test } from '@playwright/test'

import { ACTIVE_PROFILE_STORAGE_KEY, seedAppState } from './helpers/app-state'
import { formatDateKey, getFortnightDates } from '../src/utils/weekHelpers'

test('shows the export banner for a complete fortnight', async ({ page }) => {
  const weekdays = getFortnightDates(new Date()).filter((date) => {
    const day = date.getDay()
    return day >= 1 && day <= 5
  })

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
    timeEntries: weekdays.map((date, index) => ({
      id: index + 1,
      employeeId: 1,
      date: formatDateKey(date),
      sortOrder: 0,
      clientId: 1,
      clientName: 'CH Construct',
      location: 'Gent',
      startTime: '06:30',
      endTime: '15:30',
      breakMinutes: 45,
      travelCreditMinutes: 0,
      isDriver: 'Ja' as const,
      notes: '',
    })),
    localStorage: {
      [ACTIVE_PROFILE_STORAGE_KEY]: '1',
    },
  })

  await expect(page.getByText(/Werkweek compleet!/i)).toBeVisible()
  await expect(page.getByRole('button', { name: 'Deel PDF nu' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Download PDF' })).toBeVisible()
})
