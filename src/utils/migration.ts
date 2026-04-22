import Dexie, { type EntityTable } from 'dexie'

import type { Client, Employee, Location, TimeEntry, WeekExport } from '../db/database'
import { createEmployeeRecord, db } from '../db/database'
import {
  ACTIVE_PROFILE_STORAGE_KEY,
  LEGACY_ACTIVE_PROFILE_STORAGE_KEY,
  LEGACY_APP_NAME,
  LEGACY_APP_STORAGE_KEYS,
  LEGACY_LAST_DAILY_NOTIFICATION_KEY,
  LEGACY_LAST_EXPORT_NOTIFICATION_KEY,
  LEGACY_MIGRATION_KEY,
  LEGACY_NOTIFICATION_SETTINGS_STORAGE_KEY,
  LAST_DAILY_NOTIFICATION_KEY,
  LAST_EXPORT_NOTIFICATION_KEY,
  NOTIFICATION_SETTINGS_STORAGE_KEY,
} from './storageKeys'

class LegacyTimesheetDatabase extends Dexie {
  employees!: EntityTable<Employee & { exportLogo?: string }, 'id'>
  clients!: EntityTable<Client, 'id'>
  locations!: EntityTable<Location, 'id'>
  timeEntries!: EntityTable<TimeEntry, 'id'>
  weekExports!: EntityTable<WeekExport, 'id'>

  constructor() {
    super(LEGACY_APP_NAME)

    this.version(1).stores({
      employees: '++id, name, exportRecipient, sortOrder, isActive, createdAt',
      clients: '++id, name, lastUsedAt',
      locations: '++id, name',
      timeEntries: '++id, employeeId, date, [employeeId+date], sortOrder, clientId, clientName',
      weekExports: '++id, employeeId, weekStart, weekEnd, exportedAt, format, [employeeId+weekStart+weekEnd]',
    })
  }
}

const LEGACY_TO_CURRENT_STORAGE_KEYS: Array<[string, string]> = [
  [LEGACY_ACTIVE_PROFILE_STORAGE_KEY, ACTIVE_PROFILE_STORAGE_KEY],
  [LEGACY_NOTIFICATION_SETTINGS_STORAGE_KEY, NOTIFICATION_SETTINGS_STORAGE_KEY],
  [LEGACY_LAST_DAILY_NOTIFICATION_KEY, LAST_DAILY_NOTIFICATION_KEY],
  [LEGACY_LAST_EXPORT_NOTIFICATION_KEY, LAST_EXPORT_NOTIFICATION_KEY],
]

const hasAnyLegacyStorage = () =>
  LEGACY_APP_STORAGE_KEYS.some((key) => window.localStorage.getItem(key) !== null)

const migrateLegacyStorageKeys = () => {
  for (const [legacyKey, currentKey] of LEGACY_TO_CURRENT_STORAGE_KEYS) {
    const currentValue = window.localStorage.getItem(currentKey)

    if (currentValue !== null) {
      continue
    }

    const legacyValue = window.localStorage.getItem(legacyKey)

    if (legacyValue !== null) {
      window.localStorage.setItem(currentKey, legacyValue)
    }
  }
}

const removeLegacyStorageKeys = () => {
  for (const key of LEGACY_APP_STORAGE_KEYS) {
    window.localStorage.removeItem(key)
  }
}

const countTargetRecords = async () => {
  const counts = await Promise.all([
    db.employees.count(),
    db.clients.count(),
    db.locations.count(),
    db.timeEntries.count(),
    db.weekExports.count(),
  ])

  return counts.reduce((total, count) => total + count, 0)
}

export async function migrateLegacyTimesheetData() {
  if (typeof window === 'undefined') {
    return
  }

  if (window.localStorage.getItem(LEGACY_MIGRATION_KEY) === 'done') {
    return
  }

  const legacyDbExists = await Dexie.exists(LEGACY_APP_NAME)
  const legacyStorageExists = hasAnyLegacyStorage()

  if (!legacyDbExists && !legacyStorageExists) {
    window.localStorage.setItem(LEGACY_MIGRATION_KEY, 'done')
    return
  }

  try {
    migrateLegacyStorageKeys()

    const targetRecordCount = await countTargetRecords()
    let copiedLegacyDatabase = false

    if (legacyDbExists && targetRecordCount === 0) {
      const legacyDb = new LegacyTimesheetDatabase()
      
      try {
        await legacyDb.open()

        const [employees, clients, locations, timeEntries, weekExports] = await Promise.all([
          legacyDb.employees.toArray(),
          legacyDb.clients.toArray(),
          legacyDb.locations.toArray(),
          legacyDb.timeEntries.toArray(),
          legacyDb.weekExports.toArray(),
        ])

        await db.transaction('rw', [db.employees, db.clients, db.locations, db.timeEntries, db.weekExports], async () => {
          if (employees.length > 0) {
            await db.employees.bulkPut(
              employees.map((employee) => ({
                ...createEmployeeRecord({
                  name: employee.name,
                  exportRecipient: employee.exportRecipient,
                  defaultBreakMinutes: employee.defaultBreakMinutes,
                  defaultStartTime: employee.defaultStartTime,
                  sortOrder: employee.sortOrder,
                  isActive: employee.isActive,
                  createdAt: employee.createdAt,
                }),
                id: employee.id,
              })),
            )
          }

          if (clients.length > 0) {
            await db.clients.bulkPut(clients)
          }

          if (locations.length > 0) {
            await db.locations.bulkPut(locations)
          }

          if (timeEntries.length > 0) {
            await db.timeEntries.bulkPut(timeEntries)
          }

          if (weekExports.length > 0) {
            await db.weekExports.bulkPut(weekExports)
          }
        })

        copiedLegacyDatabase = true
      } finally {
        // Always close the database, even if an error occurred
        await legacyDb.close()
      }
    }

    if (!legacyDbExists || copiedLegacyDatabase) {
      removeLegacyStorageKeys()
    }

    if (legacyDbExists && copiedLegacyDatabase) {
      await Dexie.delete(LEGACY_APP_NAME)
    }

    window.localStorage.setItem(LEGACY_MIGRATION_KEY, 'done')
  } catch (error) {
    console.error('Failed to migrate legacy timesheet data', error)
  }
}
