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

  const activeEmployeeId = useMemo(() => {
    console.log('[useActiveProfile] Computing activeEmployeeId:', { loading, profilesCount: profiles.length, requestedActiveEmployeeId })
    
    if (loading) {
      console.log('[useActiveProfile] Returning null (still loading)')
      return null
    }

    if (profiles.length === 0) {
      console.log('[useActiveProfile] Returning null (no active profiles)')
      return null
    }

    // If a profile was explicitly requested, validate it
    if (requestedActiveEmployeeId !== null) {
      const isValid = profiles.some((profile) => profile.id === requestedActiveEmployeeId)
      console.log('[useActiveProfile] Requested profile valid:', isValid)
      
      if (isValid) {
        console.log('[useActiveProfile] Returning requestedActiveEmployeeId:', requestedActiveEmployeeId)
        return requestedActiveEmployeeId
      }
      
      // If requested profile is not in active profiles, return null to show recovery screen
      console.log('[useActiveProfile] Requested profile not active, returning null')
      return null
    }

    // No profile requested yet - try to use first available as default
    const fallback = profiles[0].id ?? null
    console.log('[useActiveProfile] No profile requested, using first active profile:', fallback)
    return fallback
  }, [loading, profiles, requestedActiveEmployeeId])

  useEffect(() => {
    if (activeEmployeeId === null) {
      window.localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, String(activeEmployeeId))
  }, [activeEmployeeId])

  const activeEmployee = useMemo(() => profiles.find((profile) => profile.id === activeEmployeeId) ?? null, [activeEmployeeId, profiles])

  const setActiveEmployeeId = (employeeId: number) => {
    console.log('[useActiveProfile] setActiveEmployeeId called with:', employeeId)
    console.log('[useActiveProfile] Current profiles:', profiles.map(p => ({ id: p.id, name: p.name })))
    console.log('[useActiveProfile] Current requestedActiveEmployeeId:', requestedActiveEmployeeId)
    setActiveEmployeeIdState(employeeId)
  }

  return {
    activeEmployeeId,
    activeEmployee,
    activeProfiles: profiles,
    loading,
    setActiveEmployeeId,
  }
}
