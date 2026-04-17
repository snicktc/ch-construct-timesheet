import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'

import { createEmployeeRecord, createTimeEntryRecord, db } from '../db/database'
import { setupTestDb, teardownTestDb } from '../../tests/helpers/dbHelpers'
import {
  LAST_DAILY_NOTIFICATION_KEY,
  LAST_EXPORT_NOTIFICATION_KEY,
  NOTIFICATION_SETTINGS_STORAGE_KEY,
} from './storageKeys'
import { getNotificationSettings, requestNotificationPermission, runNotificationChecks } from './notifications'

const showNotification = vi.fn()
const requireNumericId = (value: number | undefined) => {
  if (typeof value !== 'number') {
    throw new Error('Expected Dexie add() to return a numeric id')
  }

  return value
}

describe('notifications utilities', () => {
  beforeEach(async () => {
    await setupTestDb()
    vi.useFakeTimers()
    window.localStorage.clear()
    showNotification.mockReset()
    vi.setSystemTime(new Date('2026-04-17T17:30:00'))

    Object.defineProperty(navigator, 'serviceWorker', {
      configurable: true,
      value: {
        ready: Promise.resolve({
          showNotification,
        }),
      },
    })

    globalThis.Notification = {
      permission: 'granted',
      requestPermission: vi.fn().mockResolvedValue('granted'),
    } as unknown as typeof Notification
  })

  afterEach(async () => {
    vi.useRealTimers()
    window.localStorage.clear()
    await teardownTestDb()
  })

  it('falls back to defaults for corrupted localStorage settings', () => {
    window.localStorage.setItem(NOTIFICATION_SETTINGS_STORAGE_KEY, '{invalid-json')

    expect(getNotificationSettings()).toEqual({
      dailyReminderEnabled: true,
      dailyReminderTime: '17:00',
      fridayExportPromptEnabled: true,
    })
  })

  it('returns unsupported when Notification API is unavailable', async () => {
    Reflect.deleteProperty(window, 'Notification')
    Reflect.deleteProperty(globalThis, 'Notification')

    await expect(requestNotificationPermission()).resolves.toBe('unsupported')
  })

  it('sends the daily reminder only once per day', async () => {
    await runNotificationChecks(3)

    expect(showNotification).toHaveBeenCalledTimes(1)
    expect(showNotification).toHaveBeenCalledWith(
      'Werkdag loggen?',
      expect.objectContaining({
        tag: 'daily-reminder',
      }),
    )
    expect(window.localStorage.getItem(LAST_DAILY_NOTIFICATION_KEY)).toBe('2026-04-17')

    await runNotificationChecks(3)

    expect(showNotification).toHaveBeenCalledTimes(1)
  })

  it('sends the Friday export prompt only once per period when the fortnight is complete', async () => {
    vi.useRealTimers()

    const employeeId = requireNumericId(await db.employees.add(
      createEmployeeRecord({ name: 'Milan', exportRecipient: 'CH Construct' }),
    ))

    window.localStorage.setItem(
      NOTIFICATION_SETTINGS_STORAGE_KEY,
      JSON.stringify({
        dailyReminderEnabled: false,
        dailyReminderTime: '17:00',
        fridayExportPromptEnabled: true,
      }),
    )

    const dates = [
      '2026-04-13',
      '2026-04-14',
      '2026-04-15',
      '2026-04-16',
      '2026-04-17',
      '2026-04-20',
      '2026-04-21',
      '2026-04-22',
      '2026-04-23',
      '2026-04-24',
    ]

    await db.timeEntries.bulkAdd(
      dates.map((date, index) =>
        createTimeEntryRecord({
          employeeId,
          date,
          sortOrder: index,
          clientId: 1,
          clientName: 'CH Construct',
          location: 'Gent',
          startTime: '06:30',
          endTime: '15:30',
        }),
      ),
    )

    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-04-17T18:30:00'))

    await runNotificationChecks(employeeId)

    expect(showNotification).toHaveBeenCalledTimes(1)
    expect(showNotification).toHaveBeenCalledWith(
      '2 weken compleet? Exporteer en verstuur.',
      expect.objectContaining({
        tag: 'friday-export-prompt',
      }),
    )
    expect(window.localStorage.getItem(LAST_EXPORT_NOTIFICATION_KEY)).toBe('2026-04-13_2026-04-26')

    await runNotificationChecks(employeeId)

    expect(showNotification).toHaveBeenCalledTimes(1)
  })
})
