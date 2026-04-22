import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createEmployeeRecord, db } from '../db/database'
import { setupTestDb, teardownTestDb } from '../../tests/helpers/dbHelpers'
import {
  ACTIVE_PROFILE_STORAGE_KEY,
  LEGACY_ACTIVE_PROFILE_STORAGE_KEY,
  LEGACY_APP_NAME,
  LEGACY_LAST_DAILY_NOTIFICATION_KEY,
  LEGACY_LAST_EXPORT_NOTIFICATION_KEY,
  LEGACY_MIGRATION_KEY,
  LEGACY_NOTIFICATION_SETTINGS_STORAGE_KEY,
  LAST_DAILY_NOTIFICATION_KEY,
  LAST_EXPORT_NOTIFICATION_KEY,
  NOTIFICATION_SETTINGS_STORAGE_KEY,
} from './storageKeys'
import { migrateLegacyTimesheetData } from './migration'

const createLegacyDb = () => {
  const legacyDb = new Dexie(LEGACY_APP_NAME)
  legacyDb.version(1).stores({
    employees: '++id, name, exportRecipient, sortOrder, isActive, createdAt',
    clients: '++id, name, lastUsedAt',
    locations: '++id, name',
    timeEntries: '++id, employeeId, date, [employeeId+date], sortOrder, clientId, clientName',
    weekExports: '++id, employeeId, weekStart, weekEnd, exportedAt, format, [employeeId+weekStart+weekEnd]',
  })
  return legacyDb
}

describe('migrateLegacyTimesheetData', () => {
  beforeEach(async () => {
    await setupTestDb()
    window.localStorage.clear()
    await Dexie.delete(LEGACY_APP_NAME)
  })

  afterEach(async () => {
    await Dexie.delete(LEGACY_APP_NAME)
    await teardownTestDb()
    window.localStorage.clear()
  })

  it('marks migration as done when no legacy data exists', async () => {
    await migrateLegacyTimesheetData()

    expect(window.localStorage.getItem(LEGACY_MIGRATION_KEY)).toBe('done')
  })

  it('migrates legacy storage and database into an empty target database', async () => {
    const legacyDb = createLegacyDb()
    await legacyDb.open()
    await legacyDb.table('employees').add({
      ...createEmployeeRecord({ name: 'Legacy User', exportRecipient: 'VBW' }),
      exportLogo: 'data:image/png;base64,old-logo',
    })
    await legacyDb.close()

    window.localStorage.setItem(LEGACY_ACTIVE_PROFILE_STORAGE_KEY, '7')
    window.localStorage.setItem(LEGACY_NOTIFICATION_SETTINGS_STORAGE_KEY, '{"dailyReminderEnabled":false}')
    window.localStorage.setItem(LEGACY_LAST_DAILY_NOTIFICATION_KEY, '2026-04-17')
    window.localStorage.setItem(LEGACY_LAST_EXPORT_NOTIFICATION_KEY, '2026-04-06_2026-04-19')

    await migrateLegacyTimesheetData()

    expect(await db.employees.count()).toBe(1)
    expect((await db.employees.toArray())[0]?.name).toBe('Legacy User')
    expect('exportLogo' in ((await db.employees.toArray())[0] ?? {})).toBe(false)
    expect(window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)).toBe('7')
    expect(window.localStorage.getItem(NOTIFICATION_SETTINGS_STORAGE_KEY)).toBe('{"dailyReminderEnabled":false}')
    expect(window.localStorage.getItem(LAST_DAILY_NOTIFICATION_KEY)).toBe('2026-04-17')
    expect(window.localStorage.getItem(LAST_EXPORT_NOTIFICATION_KEY)).toBe('2026-04-06_2026-04-19')
    expect(window.localStorage.getItem(LEGACY_ACTIVE_PROFILE_STORAGE_KEY)).toBeNull()
    expect(await Dexie.exists(LEGACY_APP_NAME)).toBe(false)
    expect(window.localStorage.getItem(LEGACY_MIGRATION_KEY)).toBe('done')
  })

  it('does not overwrite existing target data or remove legacy storage when target already contains records', async () => {
    await db.employees.add(createEmployeeRecord({ name: 'Current User', exportRecipient: 'CH Construct' }))

    const legacyDb = createLegacyDb()
    await legacyDb.open()
    await legacyDb.table('employees').add(createEmployeeRecord({ name: 'Legacy User', exportRecipient: 'VBW' }))
    await legacyDb.close()

    window.localStorage.setItem(LEGACY_ACTIVE_PROFILE_STORAGE_KEY, '4')

    await migrateLegacyTimesheetData()

    expect(await db.employees.count()).toBe(1)
    expect((await db.employees.toArray())[0]?.name).toBe('Current User')
    expect(window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)).toBe('4')
    expect(window.localStorage.getItem(LEGACY_ACTIVE_PROFILE_STORAGE_KEY)).toBe('4')
    expect(await Dexie.exists(LEGACY_APP_NAME)).toBe(true)
    expect(window.localStorage.getItem(LEGACY_MIGRATION_KEY)).toBe('done')
  })
})
