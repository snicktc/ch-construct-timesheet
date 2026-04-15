import Dexie, { liveQuery } from 'dexie'
import { useEffect, useMemo, useState } from 'react'

import { type Employee, db } from '../db/database'
import { ACTIVE_PROFILE_STORAGE_KEY } from '../utils/storageKeys'

type ActiveProfilesState = {
  profiles: Employee[]
  loading: boolean
}

const readStoredActiveProfileId = () => {
  if (typeof window === 'undefined') {
    return null
  }

  const rawValue = window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)

  if (!rawValue) {
    return null
  }

  const parsedValue = Number(rawValue)
  return Number.isInteger(parsedValue) ? parsedValue : null
}

export function useActiveProfile() {
  const [{ profiles, loading }, setProfilesState] = useState<ActiveProfilesState>({
    profiles: [],
    loading: true,
  })
  const [requestedActiveEmployeeId, setActiveEmployeeIdState] = useState<number | null>(() =>
    readStoredActiveProfileId(),
  )
  const [activeEmployeeId, setActiveEmployeeIdInternal] = useState<number | null>(null)

  useEffect(() => {
    const subscription = liveQuery(async () => {
      console.time('[PERF] useActiveProfile: fetch active profiles')
      // Optimized: Use compound index [isActive+sortOrder] for direct filtered query
      const employees = await db.employees
        .where('[isActive+sortOrder]')
        .between([true, Dexie.minKey], [true, Dexie.maxKey])
        .toArray()
      console.timeEnd('[PERF] useActiveProfile: fetch active profiles')
      return employees
    }).subscribe({
      next: (nextProfiles) => {
        setProfilesState({ profiles: nextProfiles, loading: false })
      },
      error: (error) => {
        console.error('Failed to load active profiles', error)
        setProfilesState((current) => ({ ...current, loading: false }))
      },
    })

    return () => subscription.unsubscribe()
  }, [])

  // Compute active employee ID based on requested ID and available profiles
  useEffect(() => {
    console.log('[useActiveProfile] Computing activeEmployeeId:', { 
      loading, 
      profilesCount: profiles.length, 
      requestedActiveEmployeeId,
      profileIds: profiles.map(p => p.id)
    })
    
    if (loading) {
      console.log('[useActiveProfile] Still loading, keeping current state')
      return
    }

    if (profiles.length === 0) {
      console.log('[useActiveProfile] No active profiles, setting to null')
      setActiveEmployeeIdInternal(null)
      return
    }

    // If a profile was explicitly requested, use it if it exists in active profiles
    if (requestedActiveEmployeeId !== null) {
      const matchingProfile = profiles.find((profile) => profile.id === requestedActiveEmployeeId)
      console.log('[useActiveProfile] Looking for requested profile:', requestedActiveEmployeeId, 'Found:', matchingProfile?.name)
      
      if (matchingProfile) {
        console.log('[useActiveProfile] ✓ Setting activeEmployeeId to:', requestedActiveEmployeeId)
        setActiveEmployeeIdInternal(requestedActiveEmployeeId)
        return
      }
      
      // Requested profile not found in active profiles - could be inactive
      console.log('[useActiveProfile] ✗ Requested profile not in active list, setting to null')
      setActiveEmployeeIdInternal(null)
      return
    }

    // No profile requested yet - use first available as default
    const fallback = profiles[0]?.id ?? null
    console.log('[useActiveProfile] No profile requested, using first active profile:', fallback)
    setActiveEmployeeIdInternal(fallback)
  }, [loading, profiles, requestedActiveEmployeeId])

  useEffect(() => {
    console.log('[useActiveProfile] Persisting activeEmployeeId to localStorage:', activeEmployeeId)
    
    if (activeEmployeeId === null) {
      console.log('[useActiveProfile] Removing from localStorage')
      window.localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY)
      return
    }

    console.log('[useActiveProfile] Saving to localStorage:', activeEmployeeId)
    window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, String(activeEmployeeId))
  }, [activeEmployeeId])

  const activeEmployee = useMemo(() => profiles.find((profile) => profile.id === activeEmployeeId) ?? null, [activeEmployeeId, profiles])

  const setActiveEmployeeId = (employeeId: number) => {
    console.log('[useActiveProfile] ========================================')
    console.log('[useActiveProfile] setActiveEmployeeId CALLED')
    console.log('[useActiveProfile] Requested ID:', employeeId, 'Type:', typeof employeeId)
    console.log('[useActiveProfile] Current profiles:', profiles.map(p => ({ id: p.id, name: p.name })))
    console.log('[useActiveProfile] Current requestedActiveEmployeeId:', requestedActiveEmployeeId)
    console.log('[useActiveProfile] Calling setActiveEmployeeIdState...')
    setActiveEmployeeIdState(employeeId)
    console.log('[useActiveProfile] setActiveEmployeeIdState called!')
    console.log('[useActiveProfile] ========================================')
  }

  return {
    activeEmployeeId,
    activeEmployee,
    activeProfiles: profiles,
    loading,
    setActiveEmployeeId,
  }
}
