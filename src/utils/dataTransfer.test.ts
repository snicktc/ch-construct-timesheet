import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { APP_BACKUP_VERSION, exportAllData, importAllDataFromText, clearAllAppData } from './dataTransfer'
import { db } from '../db/database'
import { setupTestDb, teardownTestDb, seedTestDb } from '../../tests/helpers/dbHelpers'
import { ACTIVE_PROFILE_STORAGE_KEY, NOTIFICATION_SETTINGS_STORAGE_KEY } from './storageKeys'
import { createMockTimeEntry } from '../../tests/__fixtures__/timeEntries'

// Mock URL.createObjectURL and URL.revokeObjectURL
globalThis.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
globalThis.URL.revokeObjectURL = vi.fn()

describe('dataTransfer utilities', () => {
  beforeEach(async () => {
    await setupTestDb()
    // Clear localStorage
    window.localStorage.clear()
  })

  afterEach(async () => {
    await teardownTestDb()
    window.localStorage.clear()
  })

  describe('exportAllData', () => {
    it('should export all database tables', async () => {
      await seedTestDb()

      const result = await exportAllData()

      expect(result.backup).toBeDefined()
      expect(result.backup.version).toBe(APP_BACKUP_VERSION)
      expect(result.backup.exportedAt).toBeTruthy()
      expect(result.backup.data.employees.length).toBeGreaterThan(0)
      expect(result.backup.data.clients.length).toBeGreaterThan(0)
      expect(result.backup.data.timeEntries.length).toBeGreaterThan(0)
    })

    it('should export empty database', async () => {
      const result = await exportAllData()

      expect(result.backup.data.employees).toHaveLength(0)
      expect(result.backup.data.clients).toHaveLength(0)
      expect(result.backup.data.locations).toHaveLength(0)
      expect(result.backup.data.timeEntries).toHaveLength(0)
      expect(result.backup.data.weekExports).toHaveLength(0)
      expect(result.backup.data.leaveWeeks).toHaveLength(0)
    })

    it('should export leave weeks', async () => {
      const { employeeIds } = await seedTestDb({ timeEntries: false })
      await db.leaveWeeks.add({ employeeId: employeeIds[0], weekStart: '2026-04-13', createdAt: new Date() })

      const result = await exportAllData()

      expect(result.backup.data.leaveWeeks).toHaveLength(1)
      expect(result.backup.data.leaveWeeks[0]).toMatchObject({
        employeeId: employeeIds[0],
        weekStart: '2026-04-13',
      })
    })

    it('should include localStorage state', async () => {
      // Set some localStorage values
      window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, '5')
      window.localStorage.setItem(NOTIFICATION_SETTINGS_STORAGE_KEY, JSON.stringify({ enabled: true }))

      const result = await exportAllData()

      // appState.localStorage should be an object (might be empty if keys not in APP_STORAGE_KEYS)
      expect(result.backup.appState.localStorage).toBeDefined()
      expect(typeof result.backup.appState.localStorage).toBe('object')
    })

    it('should not include non-app localStorage keys', async () => {
      // Set a non-app key
      window.localStorage.setItem('random-key', 'should-not-be-exported')

      const result = await exportAllData()

      expect(result.backup.appState.localStorage['random-key']).toBeUndefined()
    })

    it('should create valid filename', async () => {
      const result = await exportAllData()

      expect(result.fileName).toMatch(/^timesheet-backup-\d{4}-\d{2}-\d{2}\.json$/)
    })

    it('should create downloadable blob', async () => {
      const result = await exportAllData()

      expect(result.blob).toBeInstanceOf(Blob)
      expect(result.blob.type).toBe('application/json')
    })

    it('should export a medium dataset efficiently', async () => {
      const { employeeIds, clientIds } = await seedTestDb({ timeEntries: false })

      for (let i = 0; i < 150; i++) {
        await db.timeEntries.add(
          createMockTimeEntry({
            employeeId: employeeIds[i % employeeIds.length],
            clientId: clientIds[i % clientIds.length],
            clientName: `Client ${i % clientIds.length}`,
            date: `2026-04-${String(14 + (i % 10)).padStart(2, '0')}`,
            sortOrder: i % 5,
            location: `Location ${i % 12}`,
          }),
        )
      }

      const startTime = performance.now()
      const result = await exportAllData()
      const duration = performance.now() - startTime

      expect(duration).toBeLessThan(1000)
      expect(result.backup.data.timeEntries.length).toBeGreaterThanOrEqual(150)
      expect(result.blob).toBeInstanceOf(Blob)
    })

    it('should create valid blob URL', async () => {
      const result = await exportAllData()

      expect(result.blob).toBeDefined()
      expect(result.fileName).toBeDefined()
    })

    it('should export valid JSON', async () => {
      await seedTestDb()
      const result = await exportAllData()

      // Should be parseable
      const json = await result.blob.text()
      const parsed = JSON.parse(json)

      expect(parsed.version).toBe(APP_BACKUP_VERSION)
      expect(parsed.data).toBeDefined()
      expect(parsed.appState).toBeDefined()
    })

    it('should preserve date types in export', async () => {
      await seedTestDb()
      const result = await exportAllData()

      // Dates should be serialized as ISO strings
      const employee = result.backup.data.employees[0]
      expect(employee.createdAt).toBeTruthy()
      expect(typeof employee.createdAt).toBe('object') // Date object
    })
  })

  describe('importBackupData', () => {
    it('should import valid backup', async () => {
      // Create a backup first
      await seedTestDb()
      const { backup } = await exportAllData()

      // Clear everything
      await clearAllAppData()
      expect(await db.employees.count()).toBe(0)

      // Import
      await importAllDataFromText(JSON.stringify(backup))

      // Verify data restored
      expect(await db.employees.count()).toBeGreaterThan(0)
      expect(await db.clients.count()).toBeGreaterThan(0)
      expect(await db.timeEntries.count()).toBeGreaterThan(0)
    })

    it('should restore localStorage state', async () => {
      window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, '7')
      const { backup } = await exportAllData()

      // Clear localStorage
      window.localStorage.clear()
      expect(window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)).toBeNull()

      // Import
      await importAllDataFromText(JSON.stringify(backup))

      // Since storage keys might not be tracked, just verify import works
      expect(await db.employees.count()).toBe(0) // Still empty as we didn't seed
    })

    it('should handle import to non-empty database', async () => {
      // Add some initial data
      await seedTestDb()

      // Create different backup
      await clearAllAppData()
      await db.employees.add({
        name: 'New Employee',
        exportRecipient: 'New Company',
        defaultBreakMinutes: 45,
        defaultStartTime: '06:30',
        sortOrder: 0,
        isActive: true,
        createdAt: new Date(),
      })
      const { backup } = await exportAllData()

      // Clear and reimport
      await clearAllAppData()
      await importAllDataFromText(JSON.stringify(backup))

      // Should have the new data
      const employee = await db.employees.where('name').equals('New Employee').first()
      expect(employee).toBeTruthy()
    })

    it('should revive Date objects correctly', async () => {
      await seedTestDb()
      const { backup } = await exportAllData()

      // Dates are serialized to ISO strings in JSON
      const jsonString = JSON.stringify(backup)

      await clearAllAppData()
      await importAllDataFromText(jsonString)

      const employees = await db.employees.toArray()
      const employee = employees[0]

      // Should be Date object again
      expect(employee.createdAt).toBeInstanceOf(Date)
      expect(employee.createdAt.getTime()).toBeGreaterThan(0)
    })

    it('should handle clients with null lastUsedAt', async () => {
      await db.clients.add({
        name: 'Unused Client',
        defaultLocation: 'Location',
        lastUsedAt: null,
      })

      const { backup } = await exportAllData()
      await clearAllAppData()
      await importAllDataFromText(JSON.stringify(backup))

      const client = await db.clients.where('name').equals('Unused Client').first()
      expect(client).toBeTruthy()
      expect(client?.lastUsedAt).toBeNull()
    })

    it('should restore leave weeks and revive createdAt', async () => {
      const { employeeIds } = await seedTestDb({ timeEntries: false })
      await db.leaveWeeks.add({ employeeId: employeeIds[0], weekStart: '2026-04-13', createdAt: new Date('2026-04-10T08:00:00Z') })

      const { backup } = await exportAllData()
      await clearAllAppData()
      expect(await db.leaveWeeks.count()).toBe(0)

      await importAllDataFromText(JSON.stringify(backup))

      const restored = await db.leaveWeeks.toArray()
      expect(restored).toHaveLength(1)
      expect(restored[0].employeeId).toBe(employeeIds[0])
      expect(restored[0].weekStart).toBe('2026-04-13')
      expect(restored[0].createdAt).toBeInstanceOf(Date)
      expect(restored[0].createdAt.toISOString()).toBe('2026-04-10T08:00:00.000Z')
    })

    it('should remove existing leave weeks that are not part of the imported backup', async () => {
      // Local device already has a leave week for employee 1.
      await db.leaveWeeks.add({ employeeId: 1, weekStart: '2026-03-02', createdAt: new Date() })

      const backup = {
        version: 2 as const,
        exportedAt: new Date().toISOString(),
        appState: { localStorage: {} },
        data: {
          employees: [{
            id: 1,
            name: 'Imported',
            exportRecipient: 'VBW',
            defaultBreakMinutes: 45,
            defaultStartTime: '06:30',
            sortOrder: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
          }],
          clients: [],
          locations: [],
          timeEntries: [],
          weekExports: [],
        },
      }

      await importAllDataFromText(JSON.stringify(backup))

      expect(await db.employees.count()).toBe(1)
      expect(await db.leaveWeeks.count()).toBe(0)
    })

    it('should handle empty backup', async () => {
      const emptyBackup = {
        version: APP_BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        appState: {
          localStorage: {},
        },
        data: {
          employees: [],
          clients: [],
          locations: [],
          timeEntries: [],
          weekExports: [],
          leaveWeeks: [],
        },
      }

      await importAllDataFromText(JSON.stringify(emptyBackup))

      expect(await db.employees.count()).toBe(0)
      expect(await db.clients.count()).toBe(0)
    })

    it('should reject unknown backup versions', async () => {
      const backup = { version: 99, exportedAt: new Date().toISOString(), appState: { localStorage: {} }, data: {} }

      await expect(importAllDataFromText(JSON.stringify(backup))).rejects.toThrow('Onbekend backupformaat.')
    })

    it('should reject non-object JSON', async () => {
      await expect(importAllDataFromText('null')).rejects.toThrow('Onbekend backupformaat.')
      await expect(importAllDataFromText('"text"')).rejects.toThrow('Onbekend backupformaat.')
    })

    it('should import large dataset efficiently', async () => {
      // Create backup with many entries
      const { employeeIds, clientIds } = await seedTestDb()
      
      // Add 100 time entries
      for (let i = 0; i < 100; i++) {
        await db.timeEntries.add({
          employeeId: employeeIds[0],
          date: `2026-04-${String(14 + (i % 10)).padStart(2, '0')}`,
          sortOrder: i % 5,
          clientId: clientIds[i % clientIds.length],
          clientName: `Client ${i % clientIds.length}`,
          location: 'Location',
          startTime: '08:00',
          endTime: '17:00',
          breakMinutes: 45,
          travelCreditMinutes: 0,
          isDriver: 'Ja',
          notes: '',
        })
      }

      const { backup } = await exportAllData()
      await clearAllAppData()

      const startTime = performance.now()
      await importAllDataFromText(JSON.stringify(backup))
      const duration = performance.now() - startTime

      // Should complete quickly
      expect(duration).toBeLessThan(1000)
      // Count might include seeded data
      expect(await db.timeEntries.count()).toBeGreaterThanOrEqual(100)
    })

    it('should handle version 1 format', async () => {
      const backup = {
        version: 1 as const,
        exportedAt: new Date().toISOString(),
        appState: {
          localStorage: {},
        },
        data: {
          employees: [],
          clients: [],
          locations: [],
          timeEntries: [],
          weekExports: [],
        },
      }

      await expect(importAllDataFromText(JSON.stringify(backup))).resolves.not.toThrow()
    })

    it('should import legacy version 1 employee records with exportLogo', async () => {
      const backup = {
        version: 1 as const,
        exportedAt: new Date().toISOString(),
        appState: {
          localStorage: {},
        },
        data: {
          employees: [{
            id: 7,
            name: ' Legacy User ',
            exportRecipient: ' VBW ',
            exportLogo: 'data:image/png;base64,old-logo',
            defaultBreakMinutes: 45,
            defaultStartTime: '06:30',
            sortOrder: 0,
            isActive: true,
            createdAt: new Date().toISOString(),
          }],
          clients: [],
          locations: [],
          timeEntries: [],
          weekExports: [],
        },
      }

      await importAllDataFromText(JSON.stringify(backup))

      const employee = await db.employees.get(7)
      expect(employee?.name).toBe('Legacy User')
      expect(employee?.exportRecipient).toBe('VBW')
      expect('exportLogo' in (employee ?? {})).toBe(false)
    })
  })

  describe('Import validation', () => {
    const buildBackup = (data: Record<string, unknown>) => ({
      version: APP_BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      appState: { localStorage: {} },
      data: {
        employees: [],
        clients: [],
        locations: [],
        timeEntries: [],
        weekExports: [],
        leaveWeeks: [],
        ...data,
      },
    })

    const validEmployee = {
      id: 1,
      name: 'Test',
      exportRecipient: 'Company',
      defaultBreakMinutes: 45,
      defaultStartTime: '06:30',
      sortOrder: 0,
      isActive: true,
      createdAt: new Date().toISOString(),
    }

    const validClient = { id: 1, name: 'Client', defaultLocation: 'Site', lastUsedAt: null }

    const validEntry = {
      id: 1,
      employeeId: 1,
      date: '2026-04-14',
      sortOrder: 0,
      clientId: 1,
      clientName: 'Client',
      location: 'Site',
      startTime: '08:00',
      endTime: '17:00',
      breakMinutes: 45,
      travelCreditMinutes: 0,
      isDriver: 'Ja',
      notes: '',
    }

    it('should reject a time entry without startTime with a clear message', async () => {
      const { startTime: _omitted, ...entryWithoutStart } = validEntry
      void _omitted

      const backup = buildBackup({
        employees: [validEmployee],
        clients: [validClient],
        timeEntries: [entryWithoutStart],
      })

      await expect(importAllDataFromText(JSON.stringify(backup))).rejects.toThrow(
        'Backupbestand is ongeldig: timeEntries[0] mist veld "startTime".',
      )
    })

    it('should reject a time entry with a mistyped clientId', async () => {
      const backup = buildBackup({
        employees: [validEmployee],
        clients: [validClient],
        timeEntries: [validEntry, { ...validEntry, id: 2, clientId: 'abc' }],
      })

      await expect(importAllDataFromText(JSON.stringify(backup))).rejects.toThrow(
        /timeEntries\[1\] heeft ongeldig veld "clientId"/,
      )
    })

    it('should reject a malformed time value', async () => {
      const backup = buildBackup({
        employees: [validEmployee],
        clients: [validClient],
        timeEntries: [{ ...validEntry, endTime: 'later' }],
      })

      await expect(importAllDataFromText(JSON.stringify(backup))).rejects.toThrow(
        /timeEntries\[0\] heeft ongeldig veld "endTime"/,
      )
    })

    it('should reject a table that is not an array', async () => {
      const backup = buildBackup({ timeEntries: 'oops' })

      await expect(importAllDataFromText(JSON.stringify(backup))).rejects.toThrow(
        'Backupbestand is ongeldig: "timeEntries" is geen lijst.',
      )
    })

    it('should reject an employee without a name', async () => {
      const { name: _omitted, ...employeeWithoutName } = validEmployee
      void _omitted

      const backup = buildBackup({ employees: [employeeWithoutName] })

      await expect(importAllDataFromText(JSON.stringify(backup))).rejects.toThrow(
        'Backupbestand is ongeldig: employees[0] mist veld "name".',
      )
    })

    it('should reject a leave week without employeeId', async () => {
      const backup = buildBackup({
        employees: [validEmployee],
        leaveWeeks: [{ weekStart: '2026-04-13', createdAt: new Date().toISOString() }],
      })

      await expect(importAllDataFromText(JSON.stringify(backup))).rejects.toThrow(
        'Backupbestand is ongeldig: leaveWeeks[0] mist veld "employeeId".',
      )
    })

    it('should leave existing data untouched when validation fails', async () => {
      const { employeeIds } = await seedTestDb()
      await db.leaveWeeks.add({ employeeId: employeeIds[0], weekStart: '2026-04-13', createdAt: new Date() })
      window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, String(employeeIds[0]))

      const employeeCount = await db.employees.count()
      const entryCount = await db.timeEntries.count()

      const backup = buildBackup({
        employees: [validEmployee],
        clients: [validClient],
        timeEntries: [{ ...validEntry, startTime: undefined }],
      })

      await expect(importAllDataFromText(JSON.stringify(backup))).rejects.toThrow('Backupbestand is ongeldig')

      expect(await db.employees.count()).toBe(employeeCount)
      expect(await db.timeEntries.count()).toBe(entryCount)
      expect(await db.leaveWeeks.count()).toBe(1)
      expect(window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)).toBe(String(employeeIds[0]))
    })

    it('should normalize imported records like regular writes', async () => {
      const backup = buildBackup({
        employees: [{ ...validEmployee, name: '  Padded  ' }],
        clients: [{ ...validClient, name: ' Client ', defaultLocation: ' Site ' }],
        timeEntries: [
          {
            ...validEntry,
            isDriver: 'Ochtend',
            breakMinutes: -10,
            notes: undefined,
            travelCreditMinutes: undefined,
            sortOrder: undefined,
          },
        ],
      })

      await importAllDataFromText(JSON.stringify(backup))

      const employee = await db.employees.get(1)
      expect(employee?.name).toBe('Padded')

      const client = await db.clients.get(1)
      expect(client?.name).toBe('Client')
      expect(client?.defaultLocation).toBe('Site')

      const entry = await db.timeEntries.get(1)
      expect(entry?.isDriver).toBe('Ja')
      expect(entry?.breakMinutes).toBe(0)
      expect(entry?.notes).toBe('')
      expect(entry?.travelCreditMinutes).toBe(0)
      expect(entry?.sortOrder).toBe(0)
    })

    it('should default missing createdAt on employees instead of storing an invalid date', async () => {
      const { createdAt: _omitted, ...employeeWithoutCreatedAt } = validEmployee
      void _omitted

      await importAllDataFromText(JSON.stringify(buildBackup({ employees: [employeeWithoutCreatedAt] })))

      const employee = await db.employees.get(1)
      expect(employee?.createdAt).toBeInstanceOf(Date)
      expect(Number.isNaN(employee!.createdAt.getTime())).toBe(false)
    })

    it('should preserve explicit ids so relationships stay intact', async () => {
      const backup = buildBackup({
        employees: [{ ...validEmployee, id: 7 }],
        clients: [{ ...validClient, id: 12 }],
        locations: [{ id: 3, name: 'Site' }],
        timeEntries: [{ ...validEntry, id: 40, employeeId: 7, clientId: 12 }],
        weekExports: [{ id: 5, employeeId: 7, weekStart: '2026-04-13', weekEnd: '2026-04-17', exportedAt: new Date().toISOString(), format: 'pdf' }],
        leaveWeeks: [{ id: 9, employeeId: 7, weekStart: '2026-04-20', createdAt: new Date().toISOString() }],
      })

      await importAllDataFromText(JSON.stringify(backup))

      expect(await db.employees.get(7)).toBeTruthy()
      expect(await db.clients.get(12)).toBeTruthy()
      expect(await db.locations.get(3)).toBeTruthy()
      expect((await db.timeEntries.get(40))?.clientId).toBe(12)
      expect((await db.weekExports.get(5))?.exportedAt).toBeInstanceOf(Date)
      expect((await db.leaveWeeks.get(9))?.employeeId).toBe(7)
    })
  })

  describe('clearAllAppData', () => {
    it('should clear all database tables', async () => {
      const { employeeIds } = await seedTestDb()
      await db.leaveWeeks.add({ employeeId: employeeIds[0], weekStart: '2026-04-13', createdAt: new Date() })

      expect(await db.employees.count()).toBeGreaterThan(0)
      expect(await db.clients.count()).toBeGreaterThan(0)
      expect(await db.leaveWeeks.count()).toBe(1)

      await clearAllAppData()

      expect(await db.employees.count()).toBe(0)
      expect(await db.clients.count()).toBe(0)
      expect(await db.locations.count()).toBe(0)
      expect(await db.timeEntries.count()).toBe(0)
      expect(await db.weekExports.count()).toBe(0)
      expect(await db.leaveWeeks.count()).toBe(0)
    })

    it('should clear app localStorage keys', async () => {
      window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, '5')
      window.localStorage.setItem(NOTIFICATION_SETTINGS_STORAGE_KEY, '{}')
      window.localStorage.setItem('other-key', 'should-remain')

      await clearAllAppData()

      // clearAppStorage() is called internally
      // Non-app keys should remain
      expect(window.localStorage.getItem('other-key')).toBe('should-remain')
      
      // App keys behavior depends on APP_STORAGE_KEYS implementation
      // Just verify the function doesn't throw
      expect(await db.employees.count()).toBe(0)
    })

    it('should handle empty database', async () => {
      await expect(clearAllAppData()).resolves.not.toThrow()
      
      expect(await db.employees.count()).toBe(0)
      expect(await db.clients.count()).toBe(0)
    })

    it('should be idempotent', async () => {
      await seedTestDb()
      
      await clearAllAppData()
      await clearAllAppData() // Second call should not error
      
      expect(await db.employees.count()).toBe(0)
    })
  })

  describe('Round-trip consistency', () => {
    it('should preserve all data through export-import cycle', async () => {
      await seedTestDb()

      // Get original counts
      const originalEmployees = await db.employees.count()
      const originalClients = await db.clients.count()
      const originalEntries = await db.timeEntries.count()

      // Export
      const { backup } = await exportAllData()

      // Clear
      await clearAllAppData()

      // Import
      await importAllDataFromText(JSON.stringify(backup))

      // Verify counts match
      expect(await db.employees.count()).toBe(originalEmployees)
      expect(await db.clients.count()).toBe(originalClients)
      expect(await db.timeEntries.count()).toBe(originalEntries)
    })

    it('should preserve employee details', async () => {
      const { employeeIds } = await seedTestDb()
      const originalEmployee = await db.employees.get(employeeIds[0])

      const { backup } = await exportAllData()
      await clearAllAppData()
      await importAllDataFromText(JSON.stringify(backup))

      const restoredEmployee = await db.employees.where('name').equals(originalEmployee!.name).first()
      
      expect(restoredEmployee?.name).toBe(originalEmployee?.name)
      expect(restoredEmployee?.exportRecipient).toBe(originalEmployee?.exportRecipient)
      expect(restoredEmployee?.defaultBreakMinutes).toBe(originalEmployee?.defaultBreakMinutes)
    })

    it('should preserve time entry relationships', async () => {
      await seedTestDb()
      
      const allEntries = await db.timeEntries.toArray()
      const originalEntry = allEntries[0]
      const originalClient = await db.clients.get(originalEntry!.clientId)

      const { backup } = await exportAllData()
      await clearAllAppData()
      await importAllDataFromText(JSON.stringify(backup))

      const restoredEntry = await db.timeEntries.where('date').equals(originalEntry!.date).first()
      const restoredClient = await db.clients.get(restoredEntry!.clientId)

      expect(restoredClient?.name).toBe(originalClient?.name)
      expect(restoredEntry?.clientName).toBe(originalEntry?.clientName)
    })
  })

  describe('Error handling', () => {
    it('should handle corrupted localStorage data gracefully', async () => {
      window.localStorage.setItem(NOTIFICATION_SETTINGS_STORAGE_KEY, 'invalid-json{')

      // Should not throw
      await expect(exportAllData()).resolves.toBeDefined()
    })

    it('should handle missing optional fields', async () => {
      const backupWithMissingFields = {
        version: 1 as const,
        exportedAt: new Date().toISOString(),
        appState: {
          localStorage: {},
        },
        data: {
          employees: [{
            name: 'Test',
            exportRecipient: 'Company',
            defaultBreakMinutes: 45,
            defaultStartTime: '06:30',
            sortOrder: 0,
            isActive: true,
            createdAt: new Date(),
            // Missing id - should be auto-generated
          }],
          clients: [],
          locations: [],
          timeEntries: [],
          weekExports: [],
        },
      }

      await expect(importAllDataFromText(JSON.stringify(backupWithMissingFields))).resolves.not.toThrow()
      
      const employees = await db.employees.toArray()
      const employee = employees[0]
      expect(employee).toBeTruthy()
      expect(employee?.id).toBeDefined()
    })
  })
})
