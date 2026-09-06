import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'

import { type Employee, db } from '../db/database'
import { ACTIVE_PROFILE_STORAGE_KEY } from '../utils/storageKeys'

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

type ActiveEmployeeState = {
  employee: Employee | null
  /** True while a stored id exists but its record has not been read yet. */
  loading: boolean
}

export function useActiveProfile() {
  const [activeEmployeeId, setActiveEmployeeIdInternal] = useState<number | null>(() => readStoredActiveProfileId())
  const [{ employee: activeEmployee, loading }, setActiveEmployeeState] = useState<ActiveEmployeeState>(() => ({
    employee: null,
    loading: readStoredActiveProfileId() !== null,
  }))

  // Observe the active employee record so that edits (name, export recipient,
  // defaults) and deletion are reflected immediately without a reload.
  useEffect(() => {
    if (activeEmployeeId === null) {
      // Nothing to load; `loading` is already false because the initial state
      // is derived from the same stored id and setActiveEmployeeId always
      // receives a concrete id.
      return
    }

    const subscription = liveQuery(() => db.employees.get(activeEmployeeId)).subscribe({
      next: (employee) => {
        setActiveEmployeeState({ employee: employee ?? null, loading: false })
      },
      error: (error) => {
        console.error('Failed to load active employee', error)
        setActiveEmployeeState({ employee: null, loading: false })
      },
    })

    return () => subscription.unsubscribe()
  }, [activeEmployeeId])

  // Persist activeEmployeeId to localStorage
  useEffect(() => {
    if (activeEmployeeId === null) {
      window.localStorage.removeItem(ACTIVE_PROFILE_STORAGE_KEY)
      return
    }

    window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, String(activeEmployeeId))
  }, [activeEmployeeId])

  const setActiveEmployeeId = (employeeId: number) => {
    if (employeeId === activeEmployeeId) {
      // The liveQuery effect would not re-run for an unchanged id, so do not
      // flip into a loading state that nothing would clear.
      return
    }

    setActiveEmployeeState({ employee: null, loading: true })
    setActiveEmployeeIdInternal(employeeId)
  }

  return {
    activeEmployeeId,
    activeEmployee,
    loading,
    setActiveEmployeeId,
  }
}
