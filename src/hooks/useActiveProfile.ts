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
    
    if (loading || profiles.length === 0) {
      console.log('[useActiveProfile] Returning null (loading or no profiles)')
      return null
    }

    const currentIsValid =
      requestedActiveEmployeeId !== null &&
      profiles.some((profile) => profile.id === requestedActiveEmployeeId)

    console.log('[useActiveProfile] currentIsValid:', currentIsValid)

    if (currentIsValid) {
      console.log('[useActiveProfile] Returning requestedActiveEmployeeId:', requestedActiveEmployeeId)
      return requestedActiveEmployeeId
    }

    const fallback = profiles[0].id ?? null
    console.log('[useActiveProfile] Falling back to first profile:', fallback)
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
