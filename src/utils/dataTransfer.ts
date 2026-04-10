import type { Client, Employee, Location, TimeEntry, WeekExport } from '../db/database'
import { db } from '../db/database'
import { APP_STORAGE_KEYS, NOTIFICATION_SETTINGS_STORAGE_KEY } from './storageKeys'

type AppBackupData = {
  version: 1
  exportedAt: string
  appState: {
    localStorage: Record<string, string>
  }
  data: {
    employees: Employee[]
    clients: Client[]
    locations: Location[]
    timeEntries: TimeEntry[]
    weekExports: WeekExport[]
  }
}

const reviveEmployee = (employee: Employee): Employee => ({
  ...employee,
  createdAt: new Date(employee.createdAt),
})

const reviveClient = (client: Client): Client => ({
  ...client,
  lastUsedAt: client.lastUsedAt ? new Date(client.lastUsedAt) : null,
})

const reviveWeekExport = (weekExport: WeekExport): WeekExport => ({
  ...weekExport,
  exportedAt: new Date(weekExport.exportedAt),
})

const clearAppStorage = () => {
  for (const key of APP_STORAGE_KEYS) {
    window.localStorage.removeItem(key)
  }
}

export async function exportAllData() {
  const [employees, clients, locations, timeEntries, weekExports] = await Promise.all([
    db.employees.toArray(),
    db.clients.toArray(),
    db.locations.toArray(),
    db.timeEntries.toArray(),
    db.weekExports.toArray(),
  ])

  const localStorageState: Record<string, string> = {}

  for (const key of APP_STORAGE_KEYS) {
    const value = window.localStorage.getItem(key)

    if (value !== null) {
      localStorageState[key] = value
    }
  }

  const backup: AppBackupData = {
    version: 1,
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
  await db.transaction('rw', [db.employees, db.clients, db.locations, db.timeEntries, db.weekExports], async () => {
    await db.weekExports.clear()
    await db.timeEntries.clear()
    await db.locations.clear()
    await db.clients.clear()
    await db.employees.clear()
  })

  clearAppStorage()
}

export async function importAllDataFromText(jsonText: string) {
  let parsed: AppBackupData

  try {
    parsed = JSON.parse(jsonText) as AppBackupData
  } catch {
    throw new Error('Backupbestand is geen geldige JSON.')
  }

  if (parsed.version !== 1 || !parsed.data) {
    throw new Error('Onbekend backupformaat.')
  }

  const employees = (parsed.data.employees ?? []).map(reviveEmployee)
  const clients = (parsed.data.clients ?? []).map(reviveClient)
  const locations = parsed.data.locations ?? []
  const timeEntries = parsed.data.timeEntries ?? []
  const weekExports = (parsed.data.weekExports ?? []).map(reviveWeekExport)

  await db.transaction('rw', [db.employees, db.clients, db.locations, db.timeEntries, db.weekExports], async () => {
    await db.weekExports.clear()
    await db.timeEntries.clear()
    await db.locations.clear()
    await db.clients.clear()
    await db.employees.clear()

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
