import Dexie from 'dexie'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import {
  TimesheetDatabase,
  createEmployeeRecord,
  createClientRecord,
  createLocationRecord,
  createTimeEntryRecord,
  createWeekExportRecord,
  DEFAULT_BREAK_MINUTES,
  DEFAULT_TRAVEL_CREDIT_MINUTES,
  DEFAULT_START_TIME,
  DEFAULT_DRIVER_STATUS,
  MAX_TIME_ENTRY_NOTES_LENGTH,
  type NewEmployeeInput,
  type NewClientInput,
  type NewLocationInput,
  type NewTimeEntryInput,
  type NewWeekExportInput,
} from './database'

describe('Database Record Creation Functions', () => {
  describe('createEmployeeRecord', () => {
    it('should create employee with minimal input', () => {
      const input: NewEmployeeInput = {
        name: 'Jan Janssen',
        exportRecipient: 'CH Construct',
      }

      const record = createEmployeeRecord(input, 0)

      expect(record.name).toBe('Jan Janssen')
      expect(record.exportRecipient).toBe('CH Construct')
      expect(record.defaultBreakMinutes).toBe(DEFAULT_BREAK_MINUTES)
      expect(record.defaultStartTime).toBe(DEFAULT_START_TIME)
      expect(record.sortOrder).toBe(0)
      expect(record.isActive).toBe(true)
      expect(record.createdAt).toBeInstanceOf(Date)
    })

    it('should trim whitespace from name and recipient', () => {
      const input: NewEmployeeInput = {
        name: '  Jan Janssen  ',
        exportRecipient: '  CH Construct  ',
      }

      const record = createEmployeeRecord(input, 0)

      expect(record.name).toBe('Jan Janssen')
      expect(record.exportRecipient).toBe('CH Construct')
    })

    it('should use provided optional values', () => {
      const input: NewEmployeeInput = {
        name: 'Piet Pietersen',
        exportRecipient: 'VBW',
        defaultBreakMinutes: 30,
        defaultStartTime: '07:00',
        sortOrder: 5,
        isActive: false,
        createdAt: new Date('2026-01-01'),
      }

      const record = createEmployeeRecord(input, 0)

      expect(record.defaultBreakMinutes).toBe(30)
      expect(record.defaultStartTime).toBe('07:00')
      expect(record.sortOrder).toBe(5)
      expect(record.isActive).toBe(false)
      expect(record.createdAt).toEqual(new Date('2026-01-01'))
    })

    it('should use existingCount for sortOrder if not provided', () => {
      const input: NewEmployeeInput = {
        name: 'Test',
        exportRecipient: 'Test',
      }

      const record = createEmployeeRecord(input, 3)
      expect(record.sortOrder).toBe(3)
    })

    it('should clamp negative break minutes to fallback', () => {
      const input: NewEmployeeInput = {
        name: 'Test',
        exportRecipient: 'Test',
        defaultBreakMinutes: -10,
      }

      const record = createEmployeeRecord(input, 0)
      expect(record.defaultBreakMinutes).toBe(0)
    })

    it('should handle invalid break minutes (NaN, Infinity)', () => {
      const inputNaN: NewEmployeeInput = {
        name: 'Test',
        exportRecipient: 'Test',
        defaultBreakMinutes: NaN,
      }

      const recordNaN = createEmployeeRecord(inputNaN, 0)
      expect(recordNaN.defaultBreakMinutes).toBe(DEFAULT_BREAK_MINUTES)

      const inputInf: NewEmployeeInput = {
        name: 'Test',
        exportRecipient: 'Test',
        defaultBreakMinutes: Infinity,
      }

      const recordInf = createEmployeeRecord(inputInf, 0)
      expect(recordInf.defaultBreakMinutes).toBe(DEFAULT_BREAK_MINUTES)
    })
  })

  describe('createClientRecord', () => {
    it('should create client with minimal input', () => {
      const input: NewClientInput = {
        name: 'Project Amsterdam',
        defaultLocation: 'Amsterdam Centrum',
      }

      const record = createClientRecord(input)

      expect(record.name).toBe('Project Amsterdam')
      expect(record.defaultLocation).toBe('Amsterdam Centrum')
      expect(record.lastUsedAt).toBeNull()
    })

    it('should trim whitespace', () => {
      const input: NewClientInput = {
        name: '  Project Rotterdam  ',
        defaultLocation: '  Rotterdam Haven  ',
      }

      const record = createClientRecord(input)

      expect(record.name).toBe('Project Rotterdam')
      expect(record.defaultLocation).toBe('Rotterdam Haven')
    })

    it('should accept lastUsedAt if provided', () => {
      const date = new Date('2026-04-15')
      const input: NewClientInput = {
        name: 'Project',
        defaultLocation: 'Location',
        lastUsedAt: date,
      }

      const record = createClientRecord(input)
      expect(record.lastUsedAt).toEqual(date)
    })
  })

  describe('createLocationRecord', () => {
    it('should create location with name', () => {
      const input: NewLocationInput = {
        name: 'Utrecht',
      }

      const record = createLocationRecord(input)
      expect(record.name).toBe('Utrecht')
    })

    it('should trim whitespace', () => {
      const input: NewLocationInput = {
        name: '  Amsterdam  ',
      }

      const record = createLocationRecord(input)
      expect(record.name).toBe('Amsterdam')
    })
  })

  describe('createTimeEntryRecord', () => {
    it('should create time entry with required fields', () => {
      const input: NewTimeEntryInput = {
        employeeId: 1,
        date: '2026-04-15',
        clientId: 1,
        location: 'Amsterdam',
        startTime: '08:00',
        endTime: '17:00',
        sortOrder: 0,
      }

      const record = createTimeEntryRecord(input)

      expect(record.employeeId).toBe(1)
      expect(record.date).toBe('2026-04-15')
      expect(record.clientId).toBe(1)
      expect(record.location).toBe('Amsterdam')
      expect(record.startTime).toBe('08:00')
      expect(record.endTime).toBe('17:00')
      expect(record.sortOrder).toBe(0)
      expect(record.breakMinutes).toBe(DEFAULT_BREAK_MINUTES)
      expect(record.travelCreditMinutes).toBe(DEFAULT_TRAVEL_CREDIT_MINUTES)
      expect(record.isDriver).toBe(DEFAULT_DRIVER_STATUS)
      expect(record.notes).toBe('')
    })

    it('should use provided optional values', () => {
      const input: NewTimeEntryInput = {
        employeeId: 1,
        date: '2026-04-15',
        clientId: 1,
        clientName: 'Custom Client',
        location: 'Rotterdam',
        startTime: '06:30',
        endTime: '15:30',
        sortOrder: 1,
        breakMinutes: 30,
        travelCreditMinutes: 15,
        isDriver: 'Nee',
        notes: 'Extra werk vandaag',
      }

      const record = createTimeEntryRecord(input)

      expect(record.clientName).toBe('Custom Client')
      expect(record.breakMinutes).toBe(30)
      expect(record.travelCreditMinutes).toBe(15)
      expect(record.isDriver).toBe('Nee')
      expect(record.notes).toBe('Extra werk vandaag')
    })

    it('should trim and normalize strings', () => {
      const input: NewTimeEntryInput = {
        employeeId: 1,
        date: '2026-04-15',
        clientId: 1,
        clientName: '  Client  ',
        location: '  Location  ',
        startTime: '08:00',
        endTime: '17:00',
        sortOrder: 0,
        notes: '  Notes with spaces  ',
      }

      const record = createTimeEntryRecord(input)

      expect(record.clientName).toBe('Client')
      expect(record.location).toBe('Location')
      expect(record.notes).toBe('Notes with spaces')
    })

    it('should truncate notes to max length', () => {
      const longNotes = 'A'.repeat(200)
      const input: NewTimeEntryInput = {
        employeeId: 1,
        date: '2026-04-15',
        clientId: 1,
        location: 'Location',
        startTime: '08:00',
        endTime: '17:00',
        sortOrder: 0,
        notes: longNotes,
      }

      const record = createTimeEntryRecord(input)
      expect(record.notes).toHaveLength(MAX_TIME_ENTRY_NOTES_LENGTH)
      expect(record.notes).toBe('A'.repeat(MAX_TIME_ENTRY_NOTES_LENGTH))
    })

    it('should normalize "Ochtend" to "Ja" for driver status', () => {
      const input: NewTimeEntryInput = {
        employeeId: 1,
        date: '2026-04-15',
        clientId: 1,
        location: 'Location',
        startTime: '08:00',
        endTime: '17:00',
        sortOrder: 0,
        isDriver: 'Ochtend' as unknown as 'Ja' | 'Nee',
      }

      const record = createTimeEntryRecord(input)
      expect(record.isDriver).toBe('Ja')
    })

    it('should use default for invalid driver status', () => {
      const input: NewTimeEntryInput = {
        employeeId: 1,
        date: '2026-04-15',
        clientId: 1,
        location: 'Location',
        startTime: '08:00',
        endTime: '17:00',
        sortOrder: 0,
        isDriver: 'Invalid' as unknown as 'Ja' | 'Nee',
      }

      const record = createTimeEntryRecord(input)
      expect(record.isDriver).toBe(DEFAULT_DRIVER_STATUS)
    })

    it('should clamp negative break minutes to 0', () => {
      const input: NewTimeEntryInput = {
        employeeId: 1,
        date: '2026-04-15',
        clientId: 1,
        location: 'Location',
        startTime: '08:00',
        endTime: '17:00',
        sortOrder: 0,
        breakMinutes: -30,
      }

      const record = createTimeEntryRecord(input)
      expect(record.breakMinutes).toBe(0)
    })

    it('should clamp negative travel credit to 0', () => {
      const input: NewTimeEntryInput = {
        employeeId: 1,
        date: '2026-04-15',
        clientId: 1,
        location: 'Location',
        startTime: '08:00',
        endTime: '17:00',
        sortOrder: 0,
        travelCreditMinutes: -15,
      }

      const record = createTimeEntryRecord(input)
      expect(record.travelCreditMinutes).toBe(0)
    })

    it('should handle NaN and Infinity for numeric fields', () => {
      const input: NewTimeEntryInput = {
        employeeId: 1,
        date: '2026-04-15',
        clientId: 1,
        location: 'Location',
        startTime: '08:00',
        endTime: '17:00',
        sortOrder: NaN,
        breakMinutes: Infinity,
        travelCreditMinutes: -Infinity,
      }

      const record = createTimeEntryRecord(input)
      expect(record.sortOrder).toBe(0)
      expect(record.breakMinutes).toBe(DEFAULT_BREAK_MINUTES)
      expect(record.travelCreditMinutes).toBe(DEFAULT_TRAVEL_CREDIT_MINUTES)
    })

    it('should round floating point numbers', () => {
      const input: NewTimeEntryInput = {
        employeeId: 1,
        date: '2026-04-15',
        clientId: 1,
        location: 'Location',
        startTime: '08:00',
        endTime: '17:00',
        sortOrder: 1.7,
        breakMinutes: 45.8,
        travelCreditMinutes: 15.3,
      }

      const record = createTimeEntryRecord(input)
      expect(record.sortOrder).toBe(2)
      expect(record.breakMinutes).toBe(46)
      expect(record.travelCreditMinutes).toBe(15)
    })
  })

  describe('createWeekExportRecord', () => {
    it('should create week export with required fields', () => {
      const input: NewWeekExportInput = {
        employeeId: 1,
        weekStart: '2026-04-13',
        weekEnd: '2026-04-26',
      }

      const record = createWeekExportRecord(input)

      expect(record.employeeId).toBe(1)
      expect(record.weekStart).toBe('2026-04-13')
      expect(record.weekEnd).toBe('2026-04-26')
      expect(record.exportedAt).toBeInstanceOf(Date)
      expect(record.format).toBe('pdf')
    })

    it('should use provided optional values', () => {
      const date = new Date('2026-04-15T10:30:00')
      const input: NewWeekExportInput = {
        employeeId: 1,
        weekStart: '2026-04-13',
        weekEnd: '2026-04-26',
        exportedAt: date,
        format: 'pdf',
      }

      const record = createWeekExportRecord(input)
      expect(record.exportedAt).toEqual(date)
      expect(record.format).toBe('pdf')
    })
  })
})

describe('Database Hooks Integration', () => {
  let db: TimesheetDatabase

  beforeEach(async () => {
    // Create fresh database instance
    db = new TimesheetDatabase()
    await db.delete()
    await db.open()
  })

  afterEach(async () => {
    await db.delete()
    await db.close()
  })

  describe('Employee Hooks', () => {
    it('should remove legacy exportLogo from existing local profiles during upgrade', async () => {
      await db.close()
      await db.delete()

      const legacyDb = new Dexie('timesheet')
      legacyDb.version(1).stores({
        employees: '++id, name, exportRecipient, sortOrder, isActive, [isActive+sortOrder], createdAt',
        clients: '++id, name, lastUsedAt',
        locations: '++id, name',
        timeEntries: '++id, employeeId, date, [employeeId+date], sortOrder, clientId, clientName',
        weekExports: '++id, employeeId, weekStart, weekEnd, exportedAt, format, [employeeId+weekStart+weekEnd]',
      })
      await legacyDb.open()
      await legacyDb.table('employees').add({
        name: 'Legacy User',
        exportRecipient: 'VBW',
        exportLogo: 'data:image/png;base64,old-logo',
        defaultBreakMinutes: 45,
        defaultStartTime: '06:30',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
      })
      await legacyDb.close()

      db = new TimesheetDatabase()
      await db.open()

      const employee = await db.employees.where('name').equals('Legacy User').first()
      expect(employee?.exportRecipient).toBe('VBW')
      expect('exportLogo' in (employee ?? {})).toBe(false)
    })

    it('should normalize data on create', async () => {
      const id = await db.employees.add({
        name: '  Jan Janssen  ',
        exportRecipient: '  CH Construct  ',
        defaultBreakMinutes: 45,
        defaultStartTime: '06:30',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
      })

      const employee = await db.employees.get(id)
      expect(employee?.name).toBe('Jan Janssen')
      expect(employee?.exportRecipient).toBe('CH Construct')
    })

    it('should set defaults on create', async () => {
      const id = await db.employees.add({
        name: 'Test',
        exportRecipient: 'Test',
        defaultBreakMinutes: 0,
        defaultStartTime: '',
        sortOrder: 0,
        isActive: false,
        createdAt: new Date(),
      })

      const employee = await db.employees.get(id)
      expect(employee?.defaultStartTime).toBe('')
      expect(employee?.isActive).toBe(false)
    })

    it('should normalize data on update', async () => {
      const id = await db.employees.add({
        name: 'Original',
        exportRecipient: 'Original',
        defaultBreakMinutes: 45,
        defaultStartTime: '06:30',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
      })

      await db.employees.update(id, {
        name: '  Updated  ',
        exportRecipient: '  Updated Recipient  ',
      })

      const employee = await db.employees.get(id)
      expect(employee?.name).toBe('Updated')
      expect(employee?.exportRecipient).toBe('Updated Recipient')
    })
  })

  describe('Client Hooks', () => {
    it('should normalize data on create', async () => {
      const id = await db.clients.add({
        name: '  Project Amsterdam  ',
        defaultLocation: '  Amsterdam  ',
        lastUsedAt: null,
      })

      const client = await db.clients.get(id)
      expect(client?.name).toBe('Project Amsterdam')
      expect(client?.defaultLocation).toBe('Amsterdam')
      expect(client?.lastUsedAt).toBeNull()
    })

    it('should normalize data on update', async () => {
      const id = await db.clients.add({
        name: 'Original',
        defaultLocation: 'Original',
        lastUsedAt: null,
      })

      await db.clients.update(id, {
        name: '  Updated  ',
        defaultLocation: '  Updated Location  ',
      })

      const client = await db.clients.get(id)
      expect(client?.name).toBe('Updated')
      expect(client?.defaultLocation).toBe('Updated Location')
    })
  })

  describe('TimeEntry Hooks', () => {
    it('should normalize and set defaults on create', async () => {
      const id = await db.timeEntries.add({
        employeeId: 1,
        date: '2026-04-15',
        sortOrder: 0,
        clientId: 1,
        clientName: '  Client  ',
        location: '  Location  ',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 45,
        travelCreditMinutes: 0,
        isDriver: 'Ja',
        notes: '  Notes  ',
      })

      const entry = await db.timeEntries.get(id)
      expect(entry?.clientName).toBe('Client')
      expect(entry?.location).toBe('Location')
      expect(entry?.notes).toBe('Notes')
    })

    it('should handle "Ochtend" conversion', async () => {
      const id = await db.timeEntries.add({
        employeeId: 1,
        date: '2026-04-15',
        sortOrder: 0,
        clientId: 1,
        clientName: 'Client',
        location: 'Location',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 45,
        travelCreditMinutes: 0,
        isDriver: 'Ochtend' as unknown as 'Ja' | 'Nee',
        notes: '',
      })

      const entry = await db.timeEntries.get(id)
      expect(entry?.isDriver).toBe('Ja')
    })

    it('should truncate long notes', async () => {
      const id = await db.timeEntries.add({
        employeeId: 1,
        date: '2026-04-15',
        sortOrder: 0,
        clientId: 1,
        clientName: 'Client',
        location: 'Location',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 45,
        travelCreditMinutes: 0,
        isDriver: 'Ja',
        notes: 'A'.repeat(200),
      })

      const entry = await db.timeEntries.get(id)
      expect(entry?.notes).toHaveLength(MAX_TIME_ENTRY_NOTES_LENGTH)
    })

    it('should clamp negative values', async () => {
      const id = await db.timeEntries.add({
        employeeId: 1,
        date: '2026-04-15',
        sortOrder: -5,
        clientId: 1,
        clientName: 'Client',
        location: 'Location',
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: -30,
        travelCreditMinutes: -15,
        isDriver: 'Ja',
        notes: '',
      })

      const entry = await db.timeEntries.get(id)
      expect(entry?.sortOrder).toBe(0)
      expect(entry?.breakMinutes).toBe(0)
      expect(entry?.travelCreditMinutes).toBe(0)
    })
  })

  describe('WeekExport Hooks', () => {
    it('should set defaults on create', async () => {
      const beforeCreate = new Date()
      
      const id = await db.weekExports.add({
        employeeId: 1,
        weekStart: '2026-04-13',
        weekEnd: '2026-04-26',
        exportedAt: new Date(),
        format: 'pdf',
      })

      const weekExport = await db.weekExports.get(id)
      expect(weekExport?.format).toBe('pdf')
      expect(weekExport?.exportedAt).toBeInstanceOf(Date)
      expect(weekExport?.exportedAt.getTime()).toBeGreaterThanOrEqual(beforeCreate.getTime())
    })
  })
})
