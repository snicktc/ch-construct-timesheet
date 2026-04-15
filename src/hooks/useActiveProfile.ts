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
  const [requestedActiveEmployeeId, setActiveEmployeeIdState] = useState<number | null>(() =>
    readStoredActiveProfileId(),
  )
  const [activeEmployeeId, setActiveEmployeeIdInternal] = useState<number | null>(null)
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null)

  // Update activeEmployeeId when requested ID changes
  useEffect(() => {
    if (requestedActiveEmployeeId !== null) {
      setActiveEmployeeIdInternal(requestedActiveEmployeeId)
    } else {
      setActiveEmployeeIdInternal(null)
    }
  }, [requestedActiveEmployeeId])

  // Fetch the active employee from database when ID changes
  useEffect(() => {
    if (activeEmployeeId === null) {
      setActiveEmployee(null)
      return
    }

    void db.employees.get(activeEmployeeId).then((employee) => {
      setActiveEmployee(employee ?? null)
    }).catch(() => {
      setActiveEmployee(null)
    })
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
    setActiveEmployeeIdState(employeeId)
    setActiveEmployeeIdInternal(employeeId)
  }

  return {
    activeEmployeeId,
    activeEmployee,
    setActiveEmployeeId,
  }
}
