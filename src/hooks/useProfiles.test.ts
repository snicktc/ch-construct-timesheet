import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useProfiles } from './useProfiles'
import { db } from '../db/database'
import { setupTestDb, teardownTestDb, seedTestDb } from '../../tests/helpers/dbHelpers'

describe('useProfiles Hook', () => {
  beforeEach(async () => {
    await setupTestDb()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  describe('Loading profiles', () => {
    it('should load all profiles sorted by sortOrder', async () => {
      await seedTestDb()

      const { result } = renderHook(() => useProfiles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.profiles.length).toBeGreaterThan(0)
      
      // Check sorting
      for (let i = 1; i < result.current.profiles.length; i++) {
        expect(result.current.profiles[i].sortOrder).toBeGreaterThanOrEqual(
          result.current.profiles[i - 1].sortOrder
        )
      }
    })

    it('should start with loading=true', () => {
      const { result } = renderHook(() => useProfiles())

      expect(result.current.loading).toBe(true)
      expect(result.current.profiles).toEqual([])
    })

    it('should filter activeProfiles', async () => {
      await seedTestDb()

      const { result } = renderHook(() => useProfiles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const allProfiles = result.current.profiles
      const activeProfiles = result.current.activeProfiles

      expect(activeProfiles.length).toBeLessThanOrEqual(allProfiles.length)
      
      // All active profiles should have isActive=true
      activeProfiles.forEach((profile) => {
        expect(profile.isActive).toBe(true)
      })

      // Inactive profiles should not be in activeProfiles
      const inactiveProfiles = allProfiles.filter((p) => !p.isActive)
      inactiveProfiles.forEach((profile) => {
        expect(activeProfiles.find((p) => p.id === profile.id)).toBeUndefined()
      })
    })
  })

  describe('createProfile', () => {
    it('should create new profile with defaults', async () => {
      const { result } = renderHook(() => useProfiles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let profileId: number | undefined

      await act(async () => {
        profileId = await result.current.createProfile({
          name: 'New Employee',
          exportRecipient: 'New Company',
        })
      })

      expect(profileId).toBeDefined()

      await waitFor(() => {
        const newProfile = result.current.profiles.find((p) => p.id === profileId)
        expect(newProfile).toBeTruthy()
        expect(newProfile?.name).toBe('New Employee')
        expect(newProfile?.exportRecipient).toBe('New Company')
        expect(newProfile?.isActive).toBe(true)
        expect(newProfile?.defaultBreakMinutes).toBe(45)
        expect(newProfile?.defaultStartTime).toBe('06:30')
      })
    })

    it('should set sortOrder based on existing count', async () => {
      const { employeeIds } = await seedTestDb()
      const countBefore = employeeIds.length

      const { result } = renderHook(() => useProfiles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      let profileId: number | undefined

      await act(async () => {
        profileId = await result.current.createProfile({
          name: 'Test',
          exportRecipient: 'Test',
        })
      })

      await waitFor(() => {
        const newProfile = result.current.profiles.find((p) => p.id === profileId)
        expect(newProfile?.sortOrder).toBe(countBefore)
      })
    })

    it('should accept custom values', async () => {
      const { result } = renderHook(() => useProfiles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.createProfile({
          name: 'Custom',
          exportRecipient: 'Custom Company',
          defaultBreakMinutes: 30,
          defaultStartTime: '07:00',
          isActive: false,
          sortOrder: 10,
        })
      })

      await waitFor(() => {
        const customProfile = result.current.profiles.find((p) => p.name === 'Custom')
        expect(customProfile?.defaultBreakMinutes).toBe(30)
        expect(customProfile?.defaultStartTime).toBe('07:00')
        expect(customProfile?.isActive).toBe(false)
        expect(customProfile?.sortOrder).toBe(10)
      })
    })
  })

  describe('updateProfile', () => {
    it('should update profile fields', async () => {
      const { employeeIds } = await seedTestDb()
      const profileId = employeeIds[0]

      const { result } = renderHook(() => useProfiles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.updateProfile(profileId, {
          name: 'Updated Name',
          defaultBreakMinutes: 60,
        })
      })

      await waitFor(() => {
        const updated = result.current.profiles.find((p) => p.id === profileId)
        expect(updated?.name).toBe('Updated Name')
        expect(updated?.defaultBreakMinutes).toBe(60)
      })
    })
  })

  describe('setProfileActiveState', () => {
    it('should activate inactive profile', async () => {
      const { employeeIds } = await seedTestDb()
      const inactiveProfileId = employeeIds[2] // Third profile is inactive

      const { result } = renderHook(() => useProfiles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const inactiveProfile = result.current.profiles.find((p) => p.id === inactiveProfileId)
      expect(inactiveProfile?.isActive).toBe(false)

      await act(async () => {
        await result.current.setProfileActiveState(inactiveProfileId, true)
      })

      await waitFor(() => {
        const activated = result.current.profiles.find((p) => p.id === inactiveProfileId)
        expect(activated?.isActive).toBe(true)
      })
    })

    it('should deactivate active profile', async () => {
      const { employeeIds } = await seedTestDb()
      const activeProfileId = employeeIds[0]

      const { result } = renderHook(() => useProfiles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await act(async () => {
        await result.current.setProfileActiveState(activeProfileId, false)
      })

      await waitFor(() => {
        const deactivated = result.current.profiles.find((p) => p.id === activeProfileId)
        expect(deactivated?.isActive).toBe(false)
      })
    })

    it('should update activeProfiles list', async () => {
      const { employeeIds } = await seedTestDb()
      const activeProfileId = employeeIds[0]

      const { result } = renderHook(() => useProfiles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const activeCountBefore = result.current.activeProfiles.length

      await act(async () => {
        await result.current.setProfileActiveState(activeProfileId, false)
      })

      await waitFor(() => {
        expect(result.current.activeProfiles.length).toBe(activeCountBefore - 1)
        const deactivated = result.current.activeProfiles.find((p) => p.id === activeProfileId)
        expect(deactivated).toBeUndefined()
      })
    })
  })

  describe('deleteProfile', () => {
    it('should delete profile without time entries', async () => {
      const { result } = renderHook(() => useProfiles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Create new profile without entries
      let newProfileId: number | undefined

      await act(async () => {
        newProfileId = await result.current.createProfile({
          name: 'To Delete',
          exportRecipient: 'Company',
        })
      })

      await waitFor(() => {
        expect(result.current.profiles.find((p) => p.id === newProfileId)).toBeTruthy()
      })

      const countBefore = result.current.profiles.length

      await act(async () => {
        await result.current.deleteProfile(newProfileId!)
      })

      await waitFor(() => {
        expect(result.current.profiles.length).toBe(countBefore - 1)
        expect(result.current.profiles.find((p) => p.id === newProfileId)).toBeUndefined()
      })

      const deleted = await db.employees.get(newProfileId!)
      expect(deleted).toBeUndefined()
    })

    it('should throw error when deleting profile with time entries', async () => {
      const { employeeIds } = await seedTestDb()
      const profileId = employeeIds[0] // Has time entries

      const { result } = renderHook(() => useProfiles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      await expect(
        act(async () => {
          await result.current.deleteProfile(profileId)
        })
      ).rejects.toThrow('Profiel heeft registraties')
    })

    it('should allow deletion after making profile inactive', async () => {
      const { result } = renderHook(() => useProfiles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Create profile
      let profileId: number | undefined

      await act(async () => {
        profileId = await result.current.createProfile({
          name: 'To Deactivate',
          exportRecipient: 'Company',
        })
      })

      // Deactivate it
      await act(async () => {
        await result.current.setProfileActiveState(profileId!, false)
      })

      // Should still be able to delete (no entries)
      await act(async () => {
        await result.current.deleteProfile(profileId!)
      })

      await waitFor(() => {
        expect(result.current.profiles.find((p) => p.id === profileId)).toBeUndefined()
      })
    })
  })

  describe('Reactive updates', () => {
    it('should update when profile added directly to database', async () => {
      const { result } = renderHook(() => useProfiles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const countBefore = result.current.profiles.length

      await db.employees.add({
        name: 'Direct Add',
        exportRecipient: 'Company',
        defaultBreakMinutes: 45,
        defaultStartTime: '06:30',
        sortOrder: 999,
        isActive: true,
        createdAt: new Date(),
      })

      await waitFor(() => {
        expect(result.current.profiles.length).toBe(countBefore + 1)
      })
    })

    it('should maintain sort order after updates', async () => {
      const { employeeIds } = await seedTestDb()

      const { result } = renderHook(() => useProfiles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // Update sortOrder
      await db.employees.update(employeeIds[0], { sortOrder: 100 })

      await waitFor(() => {
        const profiles = result.current.profiles
        for (let i = 1; i < profiles.length; i++) {
          expect(profiles[i].sortOrder).toBeGreaterThanOrEqual(profiles[i - 1].sortOrder)
        }
      })
    })
  })

  describe('Profile data integrity', () => {
    it('should preserve all fields on update', async () => {
      const { employeeIds } = await seedTestDb()
      const profileId = employeeIds[0]

      const { result } = renderHook(() => useProfiles())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      const originalProfile = result.current.profiles.find((p) => p.id === profileId)!
      const originalRecipient = originalProfile.exportRecipient

      await act(async () => {
        await result.current.updateProfile(profileId, {
          name: 'Updated Only Name',
        })
      })

      await waitFor(() => {
        const updated = result.current.profiles.find((p) => p.id === profileId)
        expect(updated?.name).toBe('Updated Only Name')
        expect(updated?.exportRecipient).toBe(originalRecipient)
      })
    })
  })
})
