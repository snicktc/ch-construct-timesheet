import { expect, test } from '@playwright/test'

import { ACTIVE_PROFILE_STORAGE_KEY, seedAppState } from './helpers/app-state'

test('can add a time entry on Today', async ({ page }) => {
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
    localStorage: {
      [ACTIVE_PROFILE_STORAGE_KEY]: '1',
    },
  })

  await page.getByRole('button', { name: 'Opslaan' }).click()

  await expect(page.getByText('Uren opgeslagen.')).toBeVisible()
  await expect(page.getByText('CH Construct - Gent')).toBeVisible()
  await expect(page.getByText('Dagtotaal')).toBeVisible()
})
