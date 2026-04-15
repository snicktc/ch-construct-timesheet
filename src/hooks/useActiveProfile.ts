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
    console.log('[useActiveProfile] 🔄 Starting profile subscription')
    
    const subscription = liveQuery(async () => {
      console.log('[useActiveProfile] 📥 Fetching active profiles from DB...')
      const employees = await db.employees
        .where('[isActive+sortOrder]')
        .between([true, Dexie.minKey], [true, Dexie.maxKey])
        .toArray()
      console.log('[useActiveProfile] 📥 Fetched profiles:', employees.map(e => ({ id: e.id, name: e.name })))
      return employees
    }).subscribe({
      next: (nextProfiles) => {
        console.log('[useActiveProfile] ✅ Profiles loaded:', nextProfiles.length)
        setProfilesState({ profiles: nextProfiles, loading: false })
      },
      error: (error) => {
        console.error('[useActiveProfile] ❌ Failed to load profiles:', error)
        setProfilesState((current) => ({ ...current, loading: false }))
      },
    })

    return () => {
      console.log('[useActiveProfile] 🛑 Unsubscribing from profile updates')
      subscription.unsubscribe()
    }
  }, [])

  // Compute active employee ID based on requested ID and available profiles
  useEffect(() => {
    console.log('[useActiveProfile] ========== COMPUTING ACTIVE EMPLOYEE ID ==========')
    console.log('[useActiveProfile] State:', { 
      loading, 
      profilesCount: profiles.length, 
      requestedActiveEmployeeId,
      profileIds: profiles.map(p => p.id),
      currentActiveEmployeeId: activeEmployeeId
    })
    
    if (loading) {
      console.log('[useActiveProfile] ❌ Still loading, skipping')
      return
    }

    if (profiles.length === 0) {
      console.log('[useActiveProfile] ❌ No active profiles available')
      setActiveEmployeeIdInternal(null)
      return
    }

    // If a profile was explicitly requested, use it (trust the request, validate later)
    if (requestedActiveEmployeeId !== null) {
      console.log('[useActiveProfile] 🔍 Requested profile ID:', requestedActiveEmployeeId)
      
      const matchingProfile = profiles.find((profile) => profile.id === requestedActiveEmployeeId)
      console.log('[useActiveProfile] Match result:', matchingProfile ? `Found: ${matchingProfile.name}` : 'NOT FOUND')
      
      if (matchingProfile) {
        console.log('[useActiveProfile] ✅ SETTING activeEmployeeId to:', requestedActiveEmployeeId)
        setActiveEmployeeIdInternal(requestedActiveEmployeeId)
      } else {
        console.log('[useActiveProfile] ⚠️  Requested profile not in active list')
        setActiveEmployeeIdInternal(null)
      }
      return
    }

    // No profile requested yet - use first available as default
    const fallback = profiles[0]?.id ?? null
    console.log('[useActiveProfile] 📌 No request, defaulting to first profile:', fallback)
    setActiveEmployeeIdInternal(fallback)
    console.log('[useActiveProfile] ===================================================')
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
