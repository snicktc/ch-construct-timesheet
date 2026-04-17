import { expect, test } from '@playwright/test'

import { ACTIVE_PROFILE_STORAGE_KEY, seedAppState } from './helpers/app-state'
import { formatDateKey } from '../src/utils/weekHelpers'

test('can export a backup and import it over different local data', async ({ page }, testInfo) => {
  const todayKey = formatDateKey(new Date())

  await seedAppState(page, {
    path: '/?tab=settings',
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
        date: todayKey,
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

  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exporteer alle data' }).click(),
  ]).then(([result]) => result)

  const backupPath = testInfo.outputPath('timesheet-backup.json')
  await download.saveAs(backupPath)

  await seedAppState(page, {
    path: '/?tab=settings',
    employees: [
      {
        id: 2,
        name: 'Kevin',
        exportRecipient: 'VBW',
        exportLogo: '',
        defaultBreakMinutes: 30,
        defaultStartTime: '07:00',
        sortOrder: 0,
        isActive: true,
        createdAt: '2026-04-01T00:00:00.000Z',
      },
    ],
    clients: [
      {
        id: 2,
        name: 'VBW',
        defaultLocation: 'Brugge',
        lastUsedAt: null,
      },
    ],
    locations: [{ id: 2, name: 'Brugge' }],
    localStorage: {
      [ACTIVE_PROFILE_STORAGE_KEY]: '2',
    },
  })

  await expect(page.getByRole('tab', { name: /Kevin/i })).toBeVisible()

  await page.locator('input[type="file"][accept="application/json,.json"]').setInputFiles(backupPath)
  await expect(page.getByRole('dialog', { name: 'Data importeren' })).toBeVisible()
  await page.getByRole('button', { name: 'Ja, importeer' }).click()

  await expect(page.getByText('CH Construct - Gent')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Vandaag' })).toBeVisible()
})
