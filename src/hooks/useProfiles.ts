import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'

import {
  type Employee,
  type NewEmployeeInput,
  createEmployeeRecord,
  db,
} from '../db/database'

type ProfilesState = {
  profiles: Employee[]
  loading: boolean
}

export function useProfiles() {
  const [{ profiles, loading }, setState] = useState<ProfilesState>({
    profiles: [],
    loading: true,
  })

  useEffect(() => {
    const subscription = liveQuery(() => db.employees.orderBy('sortOrder').toArray()).subscribe({
      next: (nextProfiles) => {
        setState({
          profiles: nextProfiles,
          loading: false,
        })
      },
      error: (error) => {
        console.error('Failed to load profiles', error)
        setState((current) => ({
          ...current,
          loading: false,
        }))
      },
    })

    return () => subscription.unsubscribe()
  }, [])

  const createProfile = async (input: NewEmployeeInput) => {
    const existingCount = await db.employees.count()
    return db.employees.add(createEmployeeRecord(input, existingCount))
  }

  const updateProfile = async (id: number, changes: Partial<Employee>) => {
    await db.employees.update(id, changes)
  }

  const setProfileActiveState = async (id: number, isActive: boolean) => {
    await db.employees.update(id, { isActive })
  }

  const deleteProfile = async (id: number) => {
    const timeEntryCount = await db.timeEntries.where('employeeId').equals(id).count()

    if (timeEntryCount > 0) {
      throw new Error(
        'Profiel heeft registraties en kan niet verwijderd worden. Maak het profiel inactief.',
      )
    }

    await db.employees.delete(id)
  }

  return {
    profiles,
    activeProfiles: profiles.filter((profile) => profile.isActive),
    loading,
    createProfile,
    updateProfile,
    setProfileActiveState,
    deleteProfile,
  }
}
