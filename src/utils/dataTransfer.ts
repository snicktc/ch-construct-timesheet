import type { Client, Employee, LeaveWeek, Location, TimeEntry, WeekExport } from '../db/database'
import { createEmployeeRecord, db } from '../db/database'
import { APP_STORAGE_KEYS, NOTIFICATION_SETTINGS_STORAGE_KEY } from './storageKeys'

type BackupEmployeeV1 = Employee & {
  exportLogo?: string
  createdAt: Date | string
}

type BackupEmployeeV2 = Employee & {
  createdAt: Date | string
}

type BackupClient = Client & {
  lastUsedAt: Date | string | null
}

type BackupWeekExport = WeekExport & {
  exportedAt: Date | string
}

type BackupLeaveWeek = LeaveWeek & {
  createdAt: Date | string
}

export const APP_BACKUP_VERSION = 3

type AppBackupData = {
  version: typeof APP_BACKUP_VERSION
  exportedAt: string
  appState: {
    localStorage: Record<string, string>
  }
  data: {
    employees: BackupEmployeeV2[]
    clients: BackupClient[]
    locations: Location[]
    timeEntries: TimeEntry[]
    weekExports: BackupWeekExport[]
    leaveWeeks: BackupLeaveWeek[]
  }
}

// Version 2 predates the leaveWeeks table.
type AppBackupDataV2 = Omit<AppBackupData, 'version' | 'data'> & {
  version: 2
  data: Omit<AppBackupData['data'], 'leaveWeeks'> & {
    leaveWeeks?: BackupLeaveWeek[]
  }
}

// Version 1 additionally carried an inline exportLogo per employee.
type LegacyAppBackupData = Omit<AppBackupDataV2, 'version' | 'data'> & {
  version: 1
  data: Omit<AppBackupDataV2['data'], 'employees'> & {
    employees: BackupEmployeeV1[]
  }
}

type SupportedAppBackupData = AppBackupData | AppBackupDataV2 | LegacyAppBackupData

const SUPPORTED_BACKUP_VERSIONS: ReadonlyArray<number> = [1, 2, APP_BACKUP_VERSION]

const ALL_TABLES = () => [db.employees, db.clients, db.locations, db.timeEntries, db.weekExports, db.leaveWeeks]

const clearAllTables = async () => {
  await db.leaveWeeks.clear()
  await db.weekExports.clear()
  await db.timeEntries.clear()
  await db.locations.clear()
  await db.clients.clear()
  await db.employees.clear()
}

const reviveEmployee = (employee: BackupEmployeeV1 | BackupEmployeeV2): Employee => ({
  ...createEmployeeRecord({
    name: employee.name,
    exportRecipient: employee.exportRecipient,
    defaultBreakMinutes: employee.defaultBreakMinutes,
    defaultStartTime: employee.defaultStartTime,
    sortOrder: employee.sortOrder,
    isActive: employee.isActive,
    createdAt: new Date(employee.createdAt),
  }),
  ...(employee.id !== undefined ? { id: employee.id } : {}),
})

const reviveClient = (client: BackupClient): Client => ({
  ...client,
  lastUsedAt: client.lastUsedAt ? new Date(client.lastUsedAt) : null,
})

const reviveWeekExport = (weekExport: BackupWeekExport): WeekExport => ({
  ...weekExport,
  exportedAt: new Date(weekExport.exportedAt),
})

const reviveLeaveWeek = (leaveWeek: BackupLeaveWeek): LeaveWeek => ({
  ...leaveWeek,
  createdAt: leaveWeek.createdAt ? new Date(leaveWeek.createdAt) : new Date(),
})

const clearAppStorage = () => {
  for (const key of APP_STORAGE_KEYS) {
    window.localStorage.removeItem(key)
  }
}

export async function exportAllData() {
  const [employees, clients, locations, timeEntries, weekExports, leaveWeeks] = await Promise.all([
    db.employees.toArray(),
    db.clients.toArray(),
    db.locations.toArray(),
    db.timeEntries.toArray(),
    db.weekExports.toArray(),
    db.leaveWeeks.toArray(),
  ])

  const localStorageState: Record<string, string> = {}

  for (const key of APP_STORAGE_KEYS) {
    const value = window.localStorage.getItem(key)

    if (value !== null) {
      localStorageState[key] = value
    }
  }

  const backup: AppBackupData = {
    version: APP_BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    appState: {
      localStorage: localStorageState,
    },
    data: {
      employees,
      clients,
      locations,
      timeEntries,
      weekExports,
      leaveWeeks,
    },
  }

  const fileName = `timesheet-backup-${backup.exportedAt.slice(0, 10)}.json`
  const json = JSON.stringify(backup, null, 2)
  const blob = new Blob([json], { type: 'application/json' })

  return {
    backup,
    json,
    blob,
    fileName,
  }
}

export async function downloadBackupFile() {
  const { blob, fileName } = await exportAllData()
  const downloadUrl = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = fileName
  link.click()
  URL.revokeObjectURL(downloadUrl)
}

export async function clearAllAppData() {
  await db.transaction('rw', ALL_TABLES(), clearAllTables)

  clearAppStorage()
}

export async function importAllDataFromText(jsonText: string) {
  let parsed: SupportedAppBackupData

  try {
    parsed = JSON.parse(jsonText) as SupportedAppBackupData
  } catch {
    throw new Error('Backupbestand is geen geldige JSON.')
  }

  if (!parsed || typeof parsed !== 'object' || !SUPPORTED_BACKUP_VERSIONS.includes(parsed.version) || !parsed.data) {
    throw new Error('Onbekend backupformaat.')
  }

  const employees = (parsed.data.employees ?? []).map(reviveEmployee)
  const clients = (parsed.data.clients ?? []).map(reviveClient)
  const locations = parsed.data.locations ?? []
  const timeEntries = parsed.data.timeEntries ?? []
  const weekExports = (parsed.data.weekExports ?? []).map(reviveWeekExport)
  const leaveWeeks = (parsed.data.leaveWeeks ?? []).map(reviveLeaveWeek)

  await db.transaction('rw', ALL_TABLES(), async () => {
    await clearAllTables()

    if (employees.length > 0) {
      await db.employees.bulkPut(employees)
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

    if (leaveWeeks.length > 0) {
      await db.leaveWeeks.bulkPut(leaveWeeks)
    }
  })

  clearAppStorage()

  const localStorageState = parsed.appState?.localStorage ?? {}

  for (const key of APP_STORAGE_KEYS) {
    const value = localStorageState[key]

    if (value !== undefined) {
      window.localStorage.setItem(key, value)
    }
  }

  if (!localStorageState[NOTIFICATION_SETTINGS_STORAGE_KEY]) {
    window.localStorage.removeItem(NOTIFICATION_SETTINGS_STORAGE_KEY)
  }
}
