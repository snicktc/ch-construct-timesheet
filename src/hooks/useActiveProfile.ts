import { liveQuery } from 'dexie'
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
      const employees = await db.employees.orderBy('sortOrder').toArray()
      return employees.filter((employee) => employee.isActive)
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
    if (loading || profiles.length === 0) {
      return null
    }

    const currentIsValid =
      requestedActiveEmployeeId !== null &&
      profiles.some((profile) => profile.id === requestedActiveEmployeeId)

    if (currentIsValid) {
      return requestedActiveEmployeeId
    }

    return profiles[0].id ?? null
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
    setActiveEmployeeIdState(employeeId)
  }

  return {
    activeEmployeeId,
    activeEmployee,
    activeProfiles: profiles,
    hasProfiles: profiles.length > 0,
    loading,
    setActiveEmployeeId,
  }
}
