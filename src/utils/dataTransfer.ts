import type { Client, Employee, LeaveWeek, Location, TimeEntry, WeekExport } from '../db/database'
import {
  createClientRecord,
  createEmployeeRecord,
  createLeaveWeekRecord,
  createLocationRecord,
  createTimeEntryRecord,
  createWeekExportRecord,
  db,
} from '../db/database'
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

// ---------------------------------------------------------------------------
// Validation
//
// Imported records are untrusted: a missing or mistyped field (e.g. an entry
// without startTime) would otherwise be written to IndexedDB and crash the UI
// on every render, leaving the user stuck in a reload loop. Every record is
// therefore type-checked and normalized before the import transaction starts.
// ---------------------------------------------------------------------------

type BackupTableName = keyof AppBackupData['data']

type UnknownRecord = Record<string, unknown>

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TIME_PATTERN = /^\d{1,2}:\d{2}$/

const invalidBackup = (table: BackupTableName, index: number, reason: string) =>
  new Error(`Backupbestand is ongeldig: ${table}[${index}] ${reason}.`)

const isRecord = (value: unknown): value is UnknownRecord => typeof value === 'object' && value !== null

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

const isOptionalNumber = (value: unknown): value is number | undefined => value === undefined || isFiniteNumber(value)

const isOptionalString = (value: unknown): value is string | undefined =>
  value === undefined || typeof value === 'string'

const isOptionalBoolean = (value: unknown): value is boolean | undefined =>
  value === undefined || typeof value === 'boolean'

const isValidId = (value: unknown): value is number => isFiniteNumber(value) && Number.isInteger(value)

const isOptionalId = (value: unknown): value is number | undefined => value === undefined || isValidId(value)

const isDateLike = (value: unknown): value is string | Date =>
  (typeof value === 'string' || value instanceof Date) && !Number.isNaN(new Date(value).getTime())

const isOptionalDateLike = (value: unknown): value is string | Date | undefined =>
  value === undefined || isDateLike(value)

const withId = <T extends object>(record: T, id: number | undefined): T & { id?: number } =>
  id === undefined ? record : { ...record, id }

const requireArray = (table: BackupTableName, value: unknown): unknown[] => {
  if (value === undefined || value === null) {
    return []
  }

  if (!Array.isArray(value)) {
    throw new Error(`Backupbestand is ongeldig: "${table}" is geen lijst.`)
  }

  return value
}

const requireField = <T>(
  table: BackupTableName,
  index: number,
  record: UnknownRecord,
  field: string,
  check: (value: unknown) => value is T,
  expectation: string,
): T => {
  const value = record[field]

  if (!check(value)) {
    const reason = value === undefined ? `mist veld "${field}"` : `heeft ongeldig veld "${field}" (verwacht ${expectation})`
    throw invalidBackup(table, index, reason)
  }

  return value
}

const requireRecord = (table: BackupTableName, index: number, value: unknown): UnknownRecord => {
  if (!isRecord(value)) {
    throw invalidBackup(table, index, 'is geen object')
  }

  return value
}

const reviveEmployee = (value: unknown, index: number): Employee => {
  const table = 'employees'
  const record = requireRecord(table, index, value)
  const id = requireField(table, index, record, 'id', isOptionalId, 'geheel getal')
  const createdAt = requireField(table, index, record, 'createdAt', isOptionalDateLike, 'datum')

  return withId(
    createEmployeeRecord({
      name: requireField(table, index, record, 'name', (v): v is string => typeof v === 'string', 'tekst'),
      exportRecipient: requireField(
        table,
        index,
        record,
        'exportRecipient',
        (v): v is string => typeof v === 'string',
        'tekst',
      ),
      defaultBreakMinutes: requireField(table, index, record, 'defaultBreakMinutes', isOptionalNumber, 'getal'),
      defaultStartTime: requireField(table, index, record, 'defaultStartTime', isOptionalString, 'tekst'),
      sortOrder: requireField(table, index, record, 'sortOrder', isOptionalNumber, 'getal'),
      isActive: requireField(table, index, record, 'isActive', isOptionalBoolean, 'ja/nee'),
      createdAt: createdAt === undefined ? undefined : new Date(createdAt),
    }),
    id,
  )
}

const reviveClient = (value: unknown, index: number): Client => {
  const table = 'clients'
  const record = requireRecord(table, index, value)
  const id = requireField(table, index, record, 'id', isOptionalId, 'geheel getal')
  const lastUsedAt = requireField(
    table,
    index,
    record,
    'lastUsedAt',
    (v): v is string | Date | null | undefined => v === null || isOptionalDateLike(v),
    'datum of leeg',
  )

  return withId(
    createClientRecord({
      name: requireField(table, index, record, 'name', (v): v is string => typeof v === 'string', 'tekst'),
      defaultLocation: requireField(
        table,
        index,
        record,
        'defaultLocation',
        (v): v is string => typeof v === 'string',
        'tekst',
      ),
      lastUsedAt: lastUsedAt ? new Date(lastUsedAt) : null,
    }),
    id,
  )
}

const reviveLocation = (value: unknown, index: number): Location => {
  const table = 'locations'
  const record = requireRecord(table, index, value)
  const id = requireField(table, index, record, 'id', isOptionalId, 'geheel getal')

  return withId(
    createLocationRecord({
      name: requireField(table, index, record, 'name', (v): v is string => typeof v === 'string', 'tekst'),
    }),
    id,
  )
}

const reviveTimeEntry = (value: unknown, index: number): TimeEntry => {
  const table = 'timeEntries'
  const record = requireRecord(table, index, value)
  const id = requireField(table, index, record, 'id', isOptionalId, 'geheel getal')

  return withId(
    createTimeEntryRecord({
      employeeId: requireField(table, index, record, 'employeeId', isValidId, 'geheel getal'),
      date: requireField(
        table,
        index,
        record,
        'date',
        (v): v is string => typeof v === 'string' && DATE_KEY_PATTERN.test(v),
        'JJJJ-MM-DD',
      ),
      sortOrder: requireField(table, index, record, 'sortOrder', isOptionalNumber, 'getal') ?? 0,
      clientId: requireField(table, index, record, 'clientId', isValidId, 'geheel getal'),
      clientName: requireField(table, index, record, 'clientName', isOptionalString, 'tekst'),
      location: requireField(table, index, record, 'location', (v): v is string => typeof v === 'string', 'tekst'),
      startTime: requireField(
        table,
        index,
        record,
        'startTime',
        (v): v is string => typeof v === 'string' && TIME_PATTERN.test(v),
        'UU:MM',
      ),
      endTime: requireField(
        table,
        index,
        record,
        'endTime',
        (v): v is string => typeof v === 'string' && TIME_PATTERN.test(v),
        'UU:MM',
      ),
      breakMinutes: requireField(table, index, record, 'breakMinutes', isOptionalNumber, 'getal'),
      travelCreditMinutes: requireField(table, index, record, 'travelCreditMinutes', isOptionalNumber, 'getal'),
      // Legacy values such as 'Ochtend' are mapped by createTimeEntryRecord.
      isDriver: requireField(table, index, record, 'isDriver', isOptionalString, 'tekst') as TimeEntry['isDriver'],
      notes: requireField(table, index, record, 'notes', isOptionalString, 'tekst'),
    }),
    id,
  )
}

const reviveWeekExport = (value: unknown, index: number): WeekExport => {
  const table = 'weekExports'
  const record = requireRecord(table, index, value)
  const id = requireField(table, index, record, 'id', isOptionalId, 'geheel getal')
  const exportedAt = requireField(table, index, record, 'exportedAt', isOptionalDateLike, 'datum')

  return withId(
    createWeekExportRecord({
      employeeId: requireField(table, index, record, 'employeeId', isValidId, 'geheel getal'),
      weekStart: requireField(table, index, record, 'weekStart', (v): v is string => typeof v === 'string', 'tekst'),
      weekEnd: requireField(table, index, record, 'weekEnd', (v): v is string => typeof v === 'string', 'tekst'),
      exportedAt: exportedAt === undefined ? undefined : new Date(exportedAt),
      format: requireField(
        table,
        index,
        record,
        'format',
        (v): v is 'pdf' | undefined => v === undefined || v === 'pdf',
        '"pdf"',
      ),
    }),
    id,
  )
}

const reviveLeaveWeek = (value: unknown, index: number): LeaveWeek => {
  const table = 'leaveWeeks'
  const record = requireRecord(table, index, value)
  const id = requireField(table, index, record, 'id', isOptionalId, 'geheel getal')
  const createdAt = requireField(table, index, record, 'createdAt', isOptionalDateLike, 'datum')

  return withId(
    createLeaveWeekRecord({
      employeeId: requireField(table, index, record, 'employeeId', isValidId, 'geheel getal'),
      weekStart: requireField(table, index, record, 'weekStart', (v): v is string => typeof v === 'string', 'tekst'),
      createdAt: createdAt === undefined ? undefined : new Date(createdAt),
    }),
    id,
  )
}

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

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    !SUPPORTED_BACKUP_VERSIONS.includes(parsed.version) ||
    !parsed.data ||
    typeof parsed.data !== 'object'
  ) {
    throw new Error('Onbekend backupformaat.')
  }

  const rawData = parsed.data as Partial<Record<BackupTableName, unknown>>

  // Validate and normalize everything before touching the database so a
  // corrupt file can never leave the app in a half-imported or crashing state.
  const employees = requireArray('employees', rawData.employees).map(reviveEmployee)
  const clients = requireArray('clients', rawData.clients).map(reviveClient)
  const locations = requireArray('locations', rawData.locations).map(reviveLocation)
  const timeEntries = requireArray('timeEntries', rawData.timeEntries).map(reviveTimeEntry)
  const weekExports = requireArray('weekExports', rawData.weekExports).map(reviveWeekExport)
  const leaveWeeks = requireArray('leaveWeeks', rawData.leaveWeeks).map(reviveLeaveWeek)

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
