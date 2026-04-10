import Dexie, { type EntityTable } from 'dexie'

export const DEFAULT_BREAK_MINUTES = 45
export const DEFAULT_TRAVEL_CREDIT_MINUTES = 0
export const DEFAULT_START_TIME = '06:30'
export const DEFAULT_DRIVER_STATUS = 'Nee'
export const MAX_TIME_ENTRY_NOTES_LENGTH = 160

export const DRIVER_STATUSES = ['Ja', 'Nee', 'Ochtend'] as const

export type DriverStatus = (typeof DRIVER_STATUSES)[number]

export interface Employee {
  id?: number
  name: string
  exportRecipient: string
  exportLogo: string
  defaultBreakMinutes: number
  defaultStartTime: string
  sortOrder: number
  isActive: boolean
  createdAt: Date
}

export interface Client {
  id?: number
  name: string
  defaultLocation: string
  lastUsedAt: Date | null
}

export interface Location {
  id?: number
  name: string
}

export interface TimeEntry {
  id?: number
  employeeId: number
  date: string
  sortOrder: number
  clientId: number
  clientName: string
  location: string
  startTime: string
  endTime: string
  breakMinutes: number
  travelCreditMinutes: number
  isDriver: DriverStatus
  notes: string
}

export interface WeekExport {
  id?: number
  employeeId: number
  weekStart: string
  weekEnd: string
  exportedAt: Date
  format: 'pdf'
}

export type NewEmployeeInput = Pick<Employee, 'name' | 'exportRecipient'> &
  Partial<Omit<Employee, 'id' | 'name' | 'exportRecipient'>>

export type NewClientInput = Pick<Client, 'name' | 'defaultLocation'> &
  Partial<Pick<Client, 'lastUsedAt'>>

export type NewLocationInput = Pick<Location, 'name'>

export type NewTimeEntryInput = Omit<TimeEntry, 'id' | 'clientName' | 'breakMinutes' | 'travelCreditMinutes' | 'isDriver' | 'notes'> &
  Partial<Pick<TimeEntry, 'clientName' | 'breakMinutes' | 'travelCreditMinutes' | 'isDriver' | 'notes'>>

export type NewWeekExportInput = Omit<WeekExport, 'id' | 'exportedAt' | 'format'> &
  Partial<Pick<WeekExport, 'exportedAt' | 'format'>>

const normalizeEmployeeChanges = (changes: Partial<Employee>): Partial<Employee> => ({
  ...(changes.name !== undefined ? { name: normalizeString(changes.name) } : {}),
  ...(changes.exportRecipient !== undefined
    ? { exportRecipient: normalizeString(changes.exportRecipient) }
    : {}),
  ...(changes.defaultBreakMinutes !== undefined
    ? {
        defaultBreakMinutes: clampNonNegativeInteger(
          changes.defaultBreakMinutes,
          DEFAULT_BREAK_MINUTES,
        ),
      }
    : {}),
  ...(changes.defaultStartTime !== undefined ? { defaultStartTime: changes.defaultStartTime } : {}),
  ...(changes.exportLogo !== undefined ? { exportLogo: changes.exportLogo ?? '' } : {}),
})

const normalizeClientChanges = (changes: Partial<Client>): Partial<Client> => ({
  ...(changes.name !== undefined ? { name: normalizeString(changes.name) } : {}),
  ...(changes.defaultLocation !== undefined
    ? { defaultLocation: normalizeString(changes.defaultLocation) }
    : {}),
})

const normalizeLocationChanges = (changes: Partial<Location>): Partial<Location> => ({
  ...(changes.name !== undefined ? { name: normalizeString(changes.name) } : {}),
})

const normalizeTimeEntryChanges = (changes: Partial<TimeEntry>): Partial<TimeEntry> => ({
  ...(changes.sortOrder !== undefined ? { sortOrder: clampNonNegativeInteger(changes.sortOrder, 0) } : {}),
  ...(changes.clientName !== undefined ? { clientName: normalizeString(changes.clientName) } : {}),
  ...(changes.location !== undefined ? { location: normalizeString(changes.location) } : {}),
  ...(changes.breakMinutes !== undefined
    ? { breakMinutes: clampNonNegativeInteger(changes.breakMinutes, DEFAULT_BREAK_MINUTES) }
    : {}),
  ...(changes.travelCreditMinutes !== undefined
    ? {
        travelCreditMinutes: clampNonNegativeInteger(
          changes.travelCreditMinutes,
          DEFAULT_TRAVEL_CREDIT_MINUTES,
        ),
      }
    : {}),
  ...(changes.isDriver !== undefined ? { isDriver: normalizeDriverStatus(changes.isDriver) } : {}),
  ...(changes.notes !== undefined ? { notes: normalizeTimeEntryNotes(changes.notes) } : {}),
})

const normalizeWeekExportChanges = (changes: Partial<WeekExport>): Partial<WeekExport> => ({
  ...(changes.format !== undefined ? { format: changes.format ?? 'pdf' } : {}),
})

const clampNonNegativeInteger = (value: number, fallback: number) => {
  if (!Number.isFinite(value)) {
    return fallback
  }

  return Math.max(0, Math.round(value))
}

const normalizeString = (value: string) => value.trim()

const normalizeTimeEntryNotes = (notes: string) => normalizeString(notes).slice(0, MAX_TIME_ENTRY_NOTES_LENGTH)

const normalizeDriverStatus = (value: string | undefined): DriverStatus => {
  if (value && DRIVER_STATUSES.includes(value as DriverStatus)) {
    return value as DriverStatus
  }

  return DEFAULT_DRIVER_STATUS
}

export const createEmployeeRecord = (input: NewEmployeeInput, existingCount = 0): Omit<Employee, 'id'> => ({
  name: normalizeString(input.name),
  exportRecipient: normalizeString(input.exportRecipient),
  exportLogo: input.exportLogo ?? '',
  defaultBreakMinutes: clampNonNegativeInteger(input.defaultBreakMinutes ?? DEFAULT_BREAK_MINUTES, DEFAULT_BREAK_MINUTES),
  defaultStartTime: input.defaultStartTime ?? DEFAULT_START_TIME,
  sortOrder: input.sortOrder ?? existingCount,
  isActive: input.isActive ?? true,
  createdAt: input.createdAt ?? new Date(),
})

export const createClientRecord = (input: NewClientInput): Omit<Client, 'id'> => ({
  name: normalizeString(input.name),
  defaultLocation: normalizeString(input.defaultLocation),
  lastUsedAt: input.lastUsedAt ?? null,
})

export const createLocationRecord = (input: NewLocationInput): Omit<Location, 'id'> => ({
  name: normalizeString(input.name),
})

export const createTimeEntryRecord = (input: NewTimeEntryInput): Omit<TimeEntry, 'id'> => ({
  employeeId: input.employeeId,
  date: input.date,
  sortOrder: clampNonNegativeInteger(input.sortOrder, 0),
  clientId: input.clientId,
  clientName: normalizeString(input.clientName ?? ''),
  location: normalizeString(input.location),
  startTime: input.startTime,
  endTime: input.endTime,
  breakMinutes: clampNonNegativeInteger(input.breakMinutes ?? DEFAULT_BREAK_MINUTES, DEFAULT_BREAK_MINUTES),
  travelCreditMinutes: clampNonNegativeInteger(
    input.travelCreditMinutes ?? DEFAULT_TRAVEL_CREDIT_MINUTES,
    DEFAULT_TRAVEL_CREDIT_MINUTES,
  ),
  isDriver: normalizeDriverStatus(input.isDriver),
  notes: normalizeTimeEntryNotes(input.notes ?? ''),
})

export const createWeekExportRecord = (input: NewWeekExportInput): Omit<WeekExport, 'id'> => ({
  employeeId: input.employeeId,
  weekStart: input.weekStart,
  weekEnd: input.weekEnd,
  exportedAt: input.exportedAt ?? new Date(),
  format: input.format ?? 'pdf',
})

export class TimesheetDatabase extends Dexie {
  employees!: EntityTable<Employee, 'id'>
  clients!: EntityTable<Client, 'id'>
  locations!: EntityTable<Location, 'id'>
  timeEntries!: EntityTable<TimeEntry, 'id'>
  weekExports!: EntityTable<WeekExport, 'id'>

  constructor() {
    super('timesheet')

    this.version(1).stores({
      employees: '++id, name, exportRecipient, sortOrder, isActive, createdAt',
      clients: '++id, name, lastUsedAt',
      locations: '++id, name',
      timeEntries: '++id, employeeId, date, [employeeId+date], sortOrder, clientId, clientName',
      weekExports: '++id, employeeId, weekStart, weekEnd, exportedAt, format, [employeeId+weekStart+weekEnd]',
    })

    this.employees.hook('creating', (_, employee) => {
      employee.name = normalizeString(employee.name)
      employee.exportRecipient = normalizeString(employee.exportRecipient)
      employee.exportLogo = employee.exportLogo ?? ''
      employee.defaultBreakMinutes = clampNonNegativeInteger(employee.defaultBreakMinutes, DEFAULT_BREAK_MINUTES)
      employee.defaultStartTime = employee.defaultStartTime ?? DEFAULT_START_TIME
      employee.isActive = employee.isActive ?? true
      employee.createdAt = employee.createdAt ?? new Date()
    })

    this.employees.hook('updating', (changes) => normalizeEmployeeChanges(changes as Partial<Employee>))

    this.clients.hook('creating', (_, client) => {
      client.name = normalizeString(client.name)
      client.defaultLocation = normalizeString(client.defaultLocation)
      client.lastUsedAt = client.lastUsedAt ?? null
    })

    this.clients.hook('updating', (changes) => normalizeClientChanges(changes as Partial<Client>))

    this.locations.hook('creating', (_, location) => {
      location.name = normalizeString(location.name)
    })

    this.locations.hook('updating', (changes) => normalizeLocationChanges(changes as Partial<Location>))

    this.timeEntries.hook('creating', (_, entry) => {
      entry.sortOrder = clampNonNegativeInteger(entry.sortOrder, 0)
      entry.clientName = normalizeString(entry.clientName)
      entry.location = normalizeString(entry.location)
      entry.breakMinutes = clampNonNegativeInteger(entry.breakMinutes, DEFAULT_BREAK_MINUTES)
      entry.travelCreditMinutes = clampNonNegativeInteger(
        entry.travelCreditMinutes,
        DEFAULT_TRAVEL_CREDIT_MINUTES,
      )
      entry.isDriver = normalizeDriverStatus(entry.isDriver)
      entry.notes = normalizeTimeEntryNotes(entry.notes ?? '')
    })

    this.timeEntries.hook('updating', (changes) => normalizeTimeEntryChanges(changes as Partial<TimeEntry>))

    this.weekExports.hook('creating', (_, weekExport) => {
      weekExport.exportedAt = weekExport.exportedAt ?? new Date()
      weekExport.format = weekExport.format ?? 'pdf'
    })

    this.weekExports.hook('updating', (changes) => normalizeWeekExportChanges(changes as Partial<WeekExport>))
  }
}

export const db = new TimesheetDatabase()
