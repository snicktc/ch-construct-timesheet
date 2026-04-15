import Dexie, { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'

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

  // Set active employee ID directly from requested ID (trust the caller)
  useEffect(() => {
    console.log('[useActiveProfile] ========== UPDATING ACTIVE EMPLOYEE ID ==========')
    console.log('[useActiveProfile] requestedActiveEmployeeId:', requestedActiveEmployeeId)
    
    // If a profile was explicitly requested, use it immediately (no validation needed)
    if (requestedActiveEmployeeId !== null) {
      console.log('[useActiveProfile] ✅ Setting activeEmployeeId to requested:', requestedActiveEmployeeId)
      setActiveEmployeeIdInternal(requestedActiveEmployeeId)
      return
    }

    // No profile requested - only fallback if we have profiles loaded
    if (!loading && profiles.length > 0) {
      const fallback = profiles[0]?.id ?? null
      console.log('[useActiveProfile] 📌 No request, defaulting to first profile:', fallback)
      setActiveEmployeeIdInternal(fallback)
      return
    }

    // Still loading or no profiles available
    console.log('[useActiveProfile] ⏳ Waiting for profiles or no profiles available')
    setActiveEmployeeIdInternal(null)
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

  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null)

  // Fetch the active employee from the database when activeEmployeeId changes
  useEffect(() => {
    if (activeEmployeeId === null) {
      setActiveEmployee(null)
      return
    }

    console.log('[useActiveProfile] Fetching employee from DB with ID:', activeEmployeeId)
    
    db.employees.get(activeEmployeeId).then((employee) => {
      console.log('[useActiveProfile] Fetched employee:', employee?.name)
      setActiveEmployee(employee ?? null)
    }).catch((error) => {
      console.error('[useActiveProfile] Failed to fetch employee:', error)
      setActiveEmployee(null)
    })
  }, [activeEmployeeId])

  const setActiveEmployeeId = (employeeId: number) => {
    console.log('[useActiveProfile] ========================================')
    console.log('[useActiveProfile] setActiveEmployeeId CALLED with ID:', employeeId)
    
    // Set both the requested ID AND the active ID immediately
    console.log('[useActiveProfile] Setting requestedActiveEmployeeId...')
    setActiveEmployeeIdState(employeeId)
    
    console.log('[useActiveProfile] Setting activeEmployeeId directly...')
    setActiveEmployeeIdInternal(employeeId)
    
    console.log('[useActiveProfile] Both states updated!')
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
