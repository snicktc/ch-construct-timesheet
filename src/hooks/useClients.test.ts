import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useClients } from './useClients'
import { db } from '../db/database'
import { setupTestDb, teardownTestDb, seedTestDb } from '../../tests/helpers/dbHelpers'

describe('useClients Hook', () => {
  beforeEach(async () => {
    await setupTestDb()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  describe('Loading clients', () => {
    it('should load all clients', async () => {
      await seedTestDb()

      const { result } = renderHook(() => useClients())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.clients.length).toBeGreaterThan(0)
    })

    it('should start with loading=true', () => {
      const { result } = renderHook(() => useClients())

      expect(result.current.loading).toBe(true)
      expect(result.current.clients).toEqual([])
    })

    it('should load empty array if no clients', async () => {
      const { result } = renderHook(() => useClients())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.clients).toEqual([])
    })
  })

  describe('Client sorting', () => {
    it('should sort clients by lastUsedAt DESC (most recent first)', async () => {
      await seedTestDb()

      const { result } = renderHook(() => useClients())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const clients = result.current.clients
      expect(clients.length).toBeGreaterThanOrEqual(3)

      // First client should have most recent lastUsedAt
      const firstClient = clients[0]
      const secondClient = clients[1]

      if (firstClient.lastUsedAt && secondClient.lastUsedAt) {
        expect(firstClient.lastUsedAt.getTime()).toBeGreaterThanOrEqual(
          secondClient.lastUsedAt.getTime()
        )
      }
    })

    it('should place clients with null lastUsedAt at bottom', async () => {
      await seedTestDb()

      const { result } = renderHook(() => useClients())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const clients = result.current.clients
      const clientsWithDates = clients.filter((c) => c.lastUsedAt !== null)
      const clientsWithoutDates = clients.filter((c) => c.lastUsedAt === null)

      // All clients with dates should come before clients without
      if (clientsWithDates.length > 0 && clientsWithoutDates.length > 0) {
        const lastWithDate = clients.indexOf(clientsWithDates[clientsWithDates.length - 1])
        const firstWithoutDate = clients.indexOf(clientsWithoutDates[0])

        expect(lastWithDate).toBeLessThan(firstWithoutDate)
      }
    })

    it('should sort alphabetically for same lastUsedAt', async () => {
      // Create clients with same lastUsedAt
      const sameDate = new Date('2026-04-15')
      
      await db.clients.add({
        name: 'Zebra Project',
        defaultLocation: 'Location',
        lastUsedAt: sameDate,
      })
      await db.clients.add({
        name: 'Alpha Project',
        defaultLocation: 'Location',
        lastUsedAt: sameDate,
      })

      const { result } = renderHook(() => useClients())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const sameTimeClients = result.current.clients.filter(
        (c) => c.lastUsedAt?.getTime() === sameDate.getTime()
      )

      if (sameTimeClients.length >= 2) {
        // Should be alphabetically sorted
        expect(sameTimeClients[0].name.localeCompare(sameTimeClients[1].name)).toBeLessThanOrEqual(0)
      }
    })
  })

  describe('createClient', () => {
    it('should create new client', async () => {
      const { result } = renderHook(() => useClients())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let clientId: number | undefined

      await act(async () => {
        clientId = await result.current.createClient({
          name: 'New Project',
          defaultLocation: 'New Location',
        })
      })

      expect(clientId).toBeDefined()

      await waitFor(() => {
        const newClient = result.current.clients.find((c) => c.id === clientId)
        expect(newClient).toBeTruthy()
        expect(newClient?.name).toBe('New Project')
        expect(newClient?.defaultLocation).toBe('New Location')
        expect(newClient?.lastUsedAt).toBeNull()
      })
    })

    it('should create location when creating client', async () => {
      const { result } = renderHook(() => useClients())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.createClient({
          name: 'Test Client',
          defaultLocation: 'Unique Location XYZ',
        })
      })

      const location = await db.locations.where('name').equals('Unique Location XYZ').first()
      expect(location).toBeTruthy()
    })

    it('should not duplicate location if it exists', async () => {
      // Create location first
      await db.locations.add({ name: 'Existing Location' })
      const countBefore = await db.locations.where('name').equals('Existing Location').count()

      const { result } = renderHook(() => useClients())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.createClient({
          name: 'Test Client',
          defaultLocation: 'Existing Location',
        })
      })

      const countAfter = await db.locations.where('name').equals('Existing Location').count()
      expect(countAfter).toBe(countBefore)
    })
  })

  describe('updateClient', () => {
    it('should update client fields', async () => {
      const { clientIds } = await seedTestDb()
      const clientId = clientIds[0]

      const { result } = renderHook(() => useClients())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.updateClient(clientId, {
          name: 'Updated Name',
          defaultLocation: 'Updated Location',
        })
      })

      await waitFor(() => {
        const updated = result.current.clients.find((c) => c.id === clientId)
        expect(updated?.name).toBe('Updated Name')
        expect(updated?.defaultLocation).toBe('Updated Location')
      })
    })

    it('should create location when updating defaultLocation', async () => {
      const { clientIds } = await seedTestDb()
      const clientId = clientIds[0]

      const { result } = renderHook(() => useClients())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.updateClient(clientId, {
          defaultLocation: 'Brand New Location',
        })
      })

      const location = await db.locations.where('name').equals('Brand New Location').first()
      expect(location).toBeTruthy()
    })
  })

  describe('deleteClient', () => {
    it('should delete client', async () => {
      const { clientIds } = await seedTestDb()
      const clientId = clientIds[0]

      const { result } = renderHook(() => useClients())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const countBefore = result.current.clients.length

      await act(async () => {
        await result.current.deleteClient(clientId)
      })

      await waitFor(() => {
        expect(result.current.clients.length).toBe(countBefore - 1)
        const deleted = result.current.clients.find((c) => c.id === clientId)
        expect(deleted).toBeUndefined()
      })

      const deletedFromDb = await db.clients.get(clientId)
      expect(deletedFromDb).toBeUndefined()
    })
  })

  describe('Reactive updates', () => {
    it('should update list when client is added', async () => {
      const { result } = renderHook(() => useClients())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const countBefore = result.current.clients.length

      // Add client directly to database
      await db.clients.add({
        name: 'Direct Add',
        defaultLocation: 'Location',
        lastUsedAt: null,
      })

      await waitFor(() => {
        expect(result.current.clients.length).toBe(countBefore + 1)
      })
    })

    it('should re-sort when lastUsedAt is updated', async () => {
      const { clientIds } = await seedTestDb()
      const clientId = clientIds[2] // Third client (oldest or null)

      const { result } = renderHook(() => useClients())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Update directly in database
      await db.clients.update(clientId, {
        lastUsedAt: new Date(), // Now most recent
      })

      await waitFor(() => {
        // Should now be first in list
        const firstClient = result.current.clients[0]
        expect(firstClient.id).toBe(clientId)
      })
    })
  })
})
