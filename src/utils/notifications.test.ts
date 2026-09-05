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

  describe('Friday export prompt', () => {
    // Fortnight 2026-04-06 .. 2026-04-19 (ISO weeks 15-16).
    const WEEK_ONE_WEEKDAYS = ['2026-04-06', '2026-04-07', '2026-04-08', '2026-04-09', '2026-04-10']
    const WEEK_TWO_WEEKDAYS = ['2026-04-13', '2026-04-14', '2026-04-15', '2026-04-16', '2026-04-17']
    const PERIOD_KEY = '2026-04-06_2026-04-19'

    const seedEmployeeWithEntries = async (dates: string[]) => {
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

      if (dates.length > 0) {
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
      }

      // Keep real timers so IndexedDB work is not stalled; vi.setSystemTime
      // still mocks Date on its own.
      return employeeId
    }

    const expectExportPromptSent = () => {
      expect(showNotification).toHaveBeenCalledTimes(1)
      expect(showNotification).toHaveBeenCalledWith(
        '2 weken compleet? Exporteer en verstuur.',
        expect.objectContaining({ tag: 'friday-export-prompt' }),
      )
    }

    it('sends the prompt once on the Friday of the second week when both weeks are complete', async () => {
      const employeeId = await seedEmployeeWithEntries([...WEEK_ONE_WEEKDAYS, ...WEEK_TWO_WEEKDAYS])
      vi.setSystemTime(new Date('2026-04-17T18:30:00'))

      await runNotificationChecks(employeeId)

      expectExportPromptSent()
      expect(window.localStorage.getItem(LAST_EXPORT_NOTIFICATION_KEY)).toBe(PERIOD_KEY)

      await runNotificationChecks(employeeId)

      expect(showNotification).toHaveBeenCalledTimes(1)
    })

    it('does not prompt on the Friday of the first week even when that week is complete', async () => {
      const employeeId = await seedEmployeeWithEntries(WEEK_ONE_WEEKDAYS)
      vi.setSystemTime(new Date('2026-04-10T18:30:00'))

      await runNotificationChecks(employeeId)

      expect(showNotification).not.toHaveBeenCalled()
      expect(window.localStorage.getItem(LAST_EXPORT_NOTIFICATION_KEY)).toBeNull()
    })

    it('does not prompt when a weekday of the period is missing', async () => {
      const employeeId = await seedEmployeeWithEntries([
        ...WEEK_ONE_WEEKDAYS,
        ...WEEK_TWO_WEEKDAYS.filter((date) => date !== '2026-04-14'),
      ])
      vi.setSystemTime(new Date('2026-04-17T18:30:00'))

      await runNotificationChecks(employeeId)

      expect(showNotification).not.toHaveBeenCalled()
    })

    it('does not prompt before 18:00', async () => {
      const employeeId = await seedEmployeeWithEntries([...WEEK_ONE_WEEKDAYS, ...WEEK_TWO_WEEKDAYS])
      vi.setSystemTime(new Date('2026-04-17T17:59:00'))

      await runNotificationChecks(employeeId)

      expect(showNotification).not.toHaveBeenCalled()
    })

    it('ignores a leave week and prompts on the Friday of the remaining worked week', async () => {
      // Week two is leave: only week one needs to be complete, prompt on its Friday.
      const employeeId = await seedEmployeeWithEntries(WEEK_ONE_WEEKDAYS)
      await db.leaveWeeks.add({ employeeId, weekStart: '2026-04-13', createdAt: new Date() })
      vi.setSystemTime(new Date('2026-04-10T18:30:00'))

      await runNotificationChecks(employeeId)

      expectExportPromptSent()
      expect(window.localStorage.getItem(LAST_EXPORT_NOTIFICATION_KEY)).toBe(PERIOD_KEY)
    })

    it('prompts on the Friday of week two when week one is leave', async () => {
      const employeeId = await seedEmployeeWithEntries(WEEK_TWO_WEEKDAYS)
      await db.leaveWeeks.add({ employeeId, weekStart: '2026-04-06', createdAt: new Date() })
      vi.setSystemTime(new Date('2026-04-17T18:30:00'))

      await runNotificationChecks(employeeId)

      expectExportPromptSent()
    })

    it('never prompts when both weeks are leave', async () => {
      const employeeId = await seedEmployeeWithEntries([])
      await db.leaveWeeks.bulkAdd([
        { employeeId, weekStart: '2026-04-06', createdAt: new Date() },
        { employeeId, weekStart: '2026-04-13', createdAt: new Date() },
      ])
      vi.setSystemTime(new Date('2026-04-17T18:30:00'))

      await runNotificationChecks(employeeId)

      expect(showNotification).not.toHaveBeenCalled()
    })
  })
})
