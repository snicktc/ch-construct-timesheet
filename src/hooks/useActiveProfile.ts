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

export function useActiveProfile() {
  const [activeEmployeeId, setActiveEmployeeIdInternal] = useState<number | null>(() => readStoredActiveProfileId())
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null)

  // Observe the active employee record so that edits (name, export recipient,
  // defaults) and deletion are reflected immediately without a reload.
  useEffect(() => {
    if (activeEmployeeId === null) {
      return
    }

    const subscription = liveQuery(() => db.employees.get(activeEmployeeId)).subscribe({
      next: (employee) => {
        setActiveEmployee(employee ?? null)
      },
      error: (error) => {
        console.error('Failed to load active employee', error)
        setActiveEmployee(null)
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
    setActiveEmployee(null)
    setActiveEmployeeIdInternal(employeeId)
  }

  return {
    activeEmployeeId,
    activeEmployee,
    setActiveEmployeeId,
  }
}
