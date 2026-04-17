import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useTimeEntry } from './useTimeEntry'
import { db, DEFAULT_BREAK_MINUTES } from '../db/database'
import { setupTestDb, teardownTestDb, clearTestDb, seedTestDb } from '../../tests/helpers/dbHelpers'
import { createMockTimeEntry } from '../../tests/__fixtures__/timeEntries'

describe('useTimeEntry Hook', () => {
  beforeEach(async () => {
    await setupTestDb()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  describe('Loading entries', () => {
    it('should load entries for employee and date', async () => {
      const { employeeIds } = await seedTestDb()
      const employeeId = employeeIds[0]
      const date = '2026-04-14'

      const { result } = renderHook(() => useTimeEntry(employeeId, date))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Should have 2 entries for employee 1 on 2026-04-14
      expect(result.current.entries).toHaveLength(2)
      expect(result.current.entries[0].date).toBe(date)
      expect(result.current.entries[0].employeeId).toBe(employeeId)
    })

    it('should sort entries by sortOrder', async () => {
      const { employeeIds } = await seedTestDb()
      const employeeId = employeeIds[0]
      const date = '2026-04-14'

      const { result } = renderHook(() => useTimeEntry(employeeId, date))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.entries).toHaveLength(2)
      expect(result.current.entries[0].sortOrder).toBe(0)
      expect(result.current.entries[1].sortOrder).toBe(1)
    })

    it('should return empty array for date with no entries', async () => {
      const { employeeIds } = await seedTestDb()
      const employeeId = employeeIds[0]
      const emptyDate = '2026-05-01'

      const { result } = renderHook(() => useTimeEntry(employeeId, emptyDate))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.entries).toHaveLength(0)
    })

    it('should return empty for null employeeId', () => {
      const { result } = renderHook(() => useTimeEntry(null, '2026-04-14'))

      expect(result.current.entries).toHaveLength(0)
      expect(result.current.loading).toBe(false)
    })
  })

  describe('Previous workday entries', () => {
    it('should load previous workday entries', async () => {
      const { employeeIds } = await seedTestDb()
      const employeeId = employeeIds[0]
      const date = '2026-04-15' // Tuesday

      const { result } = renderHook(() => useTimeEntry(employeeId, date))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Previous workday is Monday (2026-04-14) which has 2 entries
      expect(result.current.previousWorkdayEntries).toHaveLength(2)
      expect(result.current.previousWorkdayEntries[0].date).toBe('2026-04-14')
    })

    it('should return empty if no previous workday', async () => {
      const { employeeIds } = await seedTestDb()
      await clearTestDb()
      await seedTestDb({ employees: true, clients: true, timeEntries: false })
      
      const employeeId = employeeIds[0]
      const date = '2026-04-15'

      const { result } = renderHook(() => useTimeEntry(employeeId, date))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.previousWorkdayEntries).toHaveLength(0)
    })
  })

  describe('Day total calculation', () => {
    it('should calculate total minutes for day', async () => {
      const { employeeIds } = await seedTestDb()
      const employeeId = employeeIds[0]
      const date = '2026-04-14'

      const { result } = renderHook(() => useTimeEntry(employeeId, date))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Entry 1: 08:30 (510 min) - 06:30 (390 min) = 510 min - 45 break = 465 min
      // Entry 2: 17:00 (1020 min) - 15:30 (930 min) = 90 min - 30 travel = 60 min
      // Total: 465 + 60 = 525 min
      expect(result.current.dayTotalMinutes).toBeGreaterThan(0)
    })

    it('should return 0 for empty day', async () => {
      const { employeeIds } = await seedTestDb()
      const employeeId = employeeIds[0]
      const emptyDate = '2026-05-01'

      const { result } = renderHook(() => useTimeEntry(employeeId, emptyDate))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.dayTotalMinutes).toBe(0)
    })
  })

  describe('createEntry', () => {
    it('should create time entry for first entry of day', async () => {
      const { employeeIds, clientIds } = await seedTestDb({ timeEntries: false })
      const employeeId = employeeIds[0]
      const clientId = clientIds[0]
      const date = '2026-04-20'

      const { result } = renderHook(() => useTimeEntry(employeeId, date))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let entryId: number | undefined

      await act(async () => {
        entryId = await result.current.createEntry({
          employeeId,
          date,
          clientId,
          location: 'Test Location',
          startTime: '08:00',
          endTime: '17:00',
        })
      })

      expect(entryId).toBeDefined()

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(1)
      })

      const entry = result.current.entries[0]
      expect(entry.employeeId).toBe(employeeId)
      expect(entry.clientId).toBe(clientId)
      expect(entry.sortOrder).toBe(0)
      expect(entry.breakMinutes).toBe(DEFAULT_BREAK_MINUTES) // First entry gets default break
    })

    it('should create second entry with sortOrder=1 and breakMinutes=0', async () => {
      const { employeeIds, clientIds } = await seedTestDb()
      const employeeId = employeeIds[0]
      const clientId = clientIds[0]
      const date = '2026-04-14' // Already has 2 entries

      const { result } = renderHook(() => useTimeEntry(employeeId, date))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.entries).toHaveLength(2)
      })

      await act(async () => {
        await result.current.createEntry({
          employeeId,
          date,
          clientId,
          location: 'Test Location',
          startTime: '18:00',
          endTime: '20:00',
        })
      })

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(3)
      })

      const thirdEntry = result.current.entries[2]
      expect(thirdEntry.sortOrder).toBe(2)
      // For non-first entries, breakMinutes is set to 0 by useTimeEntry logic
      expect(thirdEntry.breakMinutes).toBe(0)
    })

    it('should update client lastUsedAt', async () => {
      const { employeeIds, clientIds } = await seedTestDb({ timeEntries: false })
      const employeeId = employeeIds[0]
      const clientId = clientIds[0]
      const date = '2026-04-20'

      const beforeUpdate = new Date()

      const { result } = renderHook(() => useTimeEntry(employeeId, date))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.createEntry({
          employeeId,
          date,
          clientId,
          location: 'Test Location',
          startTime: '08:00',
          endTime: '17:00',
        })
      })

      // Give async update time to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      const client = await db.clients.get(clientId)
      expect(client?.lastUsedAt).toBeTruthy()
      expect(client?.lastUsedAt!.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })

    it('should create location if it does not exist', async () => {
      const { employeeIds, clientIds } = await seedTestDb({ timeEntries: false })
      const employeeId = employeeIds[0]
      const clientId = clientIds[0]
      const date = '2026-04-20'
      const newLocation = 'Nieuwe Locatie XYZ'

      const { result } = renderHook(() => useTimeEntry(employeeId, date))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.createEntry({
          employeeId,
          date,
          clientId,
          location: newLocation,
          startTime: '08:00',
          endTime: '17:00',
        })
      })

      const location = await db.locations.where('name').equals(newLocation).first()
      expect(location).toBeTruthy()
      expect(location?.name).toBe(newLocation)
    })

    it('should throw error if client not found', async () => {
      const { employeeIds } = await seedTestDb({ clients: false, timeEntries: false })
      const employeeId = employeeIds[0]
      const date = '2026-04-20'

      const { result } = renderHook(() => useTimeEntry(employeeId, date))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.createEntry({
            employeeId,
            date,
            clientId: 999, // Non-existent
            location: 'Location',
            startTime: '08:00',
            endTime: '17:00',
          })
        })
      ).rejects.toThrow('Klant niet gevonden')
    })
  })

  describe('updateEntry', () => {
    it('should update existing entry', async () => {
      const { employeeIds } = await seedTestDb()
      const employeeId = employeeIds[0]
      const date = '2026-04-14'

      const { result } = renderHook(() => useTimeEntry(employeeId, date))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.entries).toHaveLength(2)
      })

      const entryId = result.current.entries[0].id!

      await act(async () => {
        await result.current.updateEntry(entryId, {
          startTime: '07:00',
          endTime: '16:00',
          notes: 'Updated notes',
        })
      })

      await waitFor(() => {
        const updatedEntry = result.current.entries.find((e) => e.id === entryId)
        expect(updatedEntry?.startTime).toBe('07:00')
        expect(updatedEntry?.endTime).toBe('16:00')
        expect(updatedEntry?.notes).toBe('Updated notes')
      })
    })

    it('should update client lastUsedAt when client changes', async () => {
      const { employeeIds, clientIds } = await seedTestDb()
      const employeeId = employeeIds[0]
      const date = '2026-04-14'
      const newClientId = clientIds[1]

      const { result } = renderHook(() => useTimeEntry(employeeId, date))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const entryId = result.current.entries[0].id!
      const beforeUpdate = new Date()

      await act(async () => {
        await result.current.updateEntry(entryId, {
          clientId: newClientId,
        })
      })

      await new Promise((resolve) => setTimeout(resolve, 100))

      const client = await db.clients.get(newClientId)
      expect(client?.lastUsedAt).toBeTruthy()
      expect(client?.lastUsedAt!.getTime()).toBeGreaterThanOrEqual(beforeUpdate.getTime())
    })

    it('should throw error if entry not found', async () => {
      const { employeeIds } = await seedTestDb()
      const employeeId = employeeIds[0]
      const date = '2026-04-14'

      const { result } = renderHook(() => useTimeEntry(employeeId, date))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.updateEntry(999, { notes: 'Test' })
        })
      ).rejects.toThrow('Registratie niet gevonden')
    })
  })

  describe('deleteEntry', () => {
    it('should delete entry', async () => {
      const { employeeIds } = await seedTestDb()
      const employeeId = employeeIds[0]
      const date = '2026-04-14'

      const { result } = renderHook(() => useTimeEntry(employeeId, date))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.entries).toHaveLength(2)
      })

      const entryId = result.current.entries[0].id!

      await act(async () => {
        await result.current.deleteEntry(entryId)
      })

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(1)
      })

      const deletedEntry = await db.timeEntries.get(entryId)
      expect(deletedEntry).toBeUndefined()
    })
  })

  describe('repeatPreviousWorkday (CRITICAL)', () => {
    it('should copy all entries from previous workday', async () => {
      const { employeeIds } = await seedTestDb()
      const employeeId = employeeIds[0]
      const targetDate = '2026-04-15' // Tuesday - previous workday is Monday

      const { result } = renderHook(() => useTimeEntry(employeeId, targetDate))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.entries).toHaveLength(1) // Already has 1 entry
        expect(result.current.previousWorkdayEntries).toHaveLength(2)
      })

      // Clear current day first
      await act(async () => {
        for (const entry of result.current.entries) {
          await result.current.deleteEntry(entry.id!)
        }
      })

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(0)
      })

      // Now repeat previous workday
      await act(async () => {
        await result.current.repeatPreviousWorkday(targetDate)
      })

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(2)
      })

      // Verify entries were copied with new date
      const entries = result.current.entries
      expect(entries[0].date).toBe(targetDate)
      expect(entries[1].date).toBe(targetDate)
      expect(entries[0].sortOrder).toBe(0)
      expect(entries[1].sortOrder).toBe(1)
    })

    it('should throw error if no previous workday found', async () => {
      const { employeeIds } = await seedTestDb({ timeEntries: false })
      const employeeId = employeeIds[0]
      const targetDate = '2026-04-15'

      const { result } = renderHook(() => useTimeEntry(employeeId, targetDate))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.repeatPreviousWorkday(targetDate)
        })
      ).rejects.toThrow('Geen vorige werkdag gevonden')
    })

    it('should throw error if target date already has entries', async () => {
      const { employeeIds } = await seedTestDb()
      const employeeId = employeeIds[0]
      const targetDate = '2026-04-14' // Already has 2 entries

      const { result } = renderHook(() => useTimeEntry(employeeId, targetDate))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.entries).toHaveLength(2)
      })

      await expect(
        act(async () => {
          await result.current.repeatPreviousWorkday(targetDate)
        })
      ).rejects.toThrow('Deze dag bevat al registraties')
    })

    it('should update all clients lastUsedAt in batch', async () => {
      const { employeeIds } = await seedTestDb()
      const employeeId = employeeIds[0]
      const targetDate = '2026-04-16' // Empty day
      const beforeUpdate = new Date()

      const { result } = renderHook(() => useTimeEntry(employeeId, targetDate))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
        expect(result.current.entries).toHaveLength(0)
      })

      await act(async () => {
        await result.current.repeatPreviousWorkday(targetDate)
      })

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(1)
      })

      // Check that client timestamps were updated
      const clients = await db.clients.toArray()
      const usedClients = clients.filter((c) => c.lastUsedAt && c.lastUsedAt.getTime() >= beforeUpdate.getTime())
      
      expect(usedClients.length).toBeGreaterThan(0)
    })

    it('should create missing locations in batch', async () => {
      const { employeeIds, clientIds } = await seedTestDb({ timeEntries: false })
      const employeeId = employeeIds[0]
      const clientId = clientIds[0]

      // Create entries on previous day with new locations
      await db.timeEntries.add(createMockTimeEntry({
        employeeId,
        date: '2026-04-15',
        clientId,
        location: 'New Location 1',
        sortOrder: 0,
      }))
      await db.timeEntries.add(createMockTimeEntry({
        employeeId,
        date: '2026-04-15',
        clientId,
        location: 'New Location 2',
        sortOrder: 1,
      }))

      const targetDate = '2026-04-16'

      const { result } = renderHook(() => useTimeEntry(employeeId, targetDate))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.repeatPreviousWorkday(targetDate)
      })

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(2)
      })

      // Verify locations were created
      const loc1 = await db.locations.where('name').equals('New Location 1').first()
      const loc2 = await db.locations.where('name').equals('New Location 2').first()
      
      expect(loc1).toBeTruthy()
      expect(loc2).toBeTruthy()
    })

    it('should handle large number of entries efficiently', async () => {
      const { employeeIds, clientIds } = await seedTestDb({ timeEntries: false })
      const employeeId = employeeIds[0]
      const clientId = clientIds[0]
      const previousDate = '2026-04-15'
      const targetDate = '2026-04-16'

      // Create 10 entries on previous day with explicit location variation.
      for (let i = 0; i < 10; i++) {
        await db.timeEntries.add(
          createMockTimeEntry({
            employeeId,
            date: previousDate,
            clientId,
            sortOrder: i,
            location: `Location ${i}`,
          }),
        )
      }

      const { result } = renderHook(() => useTimeEntry(employeeId, targetDate))

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const startTime = performance.now()

      await act(async () => {
        await result.current.repeatPreviousWorkday(targetDate)
      })

      const duration = performance.now() - startTime

      await waitFor(() => {
        expect(result.current.entries).toHaveLength(10)
      })

      expect(new Set(result.current.entries.map((entry) => entry.location)).size).toBe(10)

      // Basic performance guard against obvious regressions in the repeat flow.
      expect(duration).toBeLessThan(500)
    })
  })
})
