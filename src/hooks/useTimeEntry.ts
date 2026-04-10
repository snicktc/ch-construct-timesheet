import Dexie, { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'

import {
  DEFAULT_BREAK_MINUTES,
  type NewTimeEntryInput,
  type TimeEntry,
  createLocationRecord,
  createTimeEntryRecord,
  db,
} from '../db/database'
import { calculateDayTotalMinutes } from '../utils/timeCalc'

type TimeEntriesState = {
  entries: TimeEntry[]
  previousWorkdayEntries: TimeEntry[]
  loading: boolean
}

export type SaveTimeEntryInput = Omit<NewTimeEntryInput, 'sortOrder' | 'clientName' | 'breakMinutes'> &
  Partial<Pick<TimeEntry, 'sortOrder' | 'clientName' | 'breakMinutes'>>

const sortEntries = (entries: TimeEntry[]) => [...entries].sort((left, right) => left.sortOrder - right.sortOrder)

const ensureLocationExists = async (locationName: string) => {
  const trimmedLocationName = locationName.trim()

  if (!trimmedLocationName) {
    return
  }

  const existingLocation = await db.locations.where('name').equalsIgnoreCase(trimmedLocationName).first()

  if (!existingLocation) {
    await db.locations.add(createLocationRecord({ name: trimmedLocationName }))
  }
}

const getEntriesForEmployeeDate = async (employeeId: number, date: string) => {
  const entries = await db.timeEntries.where('[employeeId+date]').equals([employeeId, date]).toArray()
  return sortEntries(entries)
}

const getPreviousWorkdayEntries = async (employeeId: number, date: string) => {
  const priorEntries = await db.timeEntries
    .where('[employeeId+date]')
    .between([employeeId, Dexie.minKey], [employeeId, date], false, true)
    .toArray()

  if (priorEntries.length === 0) {
    return []
  }

  const previousWorkday = priorEntries.reduce((latestDate, entry) => {
    if (entry.date > latestDate) {
      return entry.date
    }

    return latestDate
  }, priorEntries[0].date)

  return getEntriesForEmployeeDate(employeeId, previousWorkday)
}

export function useTimeEntry(employeeId: number | null, date: string) {
  const [{ entries, previousWorkdayEntries, loading }, setState] = useState<TimeEntriesState>({
    entries: [],
    previousWorkdayEntries: [],
    loading: employeeId !== null,
  })

  useEffect(() => {
    if (!employeeId) {
      return
    }

    const subscription = liveQuery(async () => {
      const nextEntries = await getEntriesForEmployeeDate(employeeId, date)
      const nextPreviousEntries = await getPreviousWorkdayEntries(employeeId, date)

      return {
        entries: nextEntries,
        previousWorkdayEntries: nextPreviousEntries,
      }
    }).subscribe({
      next: (snapshot) => {
        setState({
          entries: snapshot.entries,
          previousWorkdayEntries: snapshot.previousWorkdayEntries,
          loading: false,
        })
      },
      error: (error) => {
        console.error('Failed to load time entries', error)
        setState((current) => ({
          ...current,
          loading: false,
        }))
      },
    })

    return () => subscription.unsubscribe()
  }, [date, employeeId])

  const visibleEntries = employeeId ? entries : []
  const visiblePreviousWorkdayEntries = employeeId ? previousWorkdayEntries : []
  const visibleLoading = employeeId ? loading : false

  const createEntry = async (input: SaveTimeEntryInput) => {
    return db.transaction('rw', db.timeEntries, db.clients, db.locations, async () => {
      const client = await db.clients.get(input.clientId)

      if (!client) {
        throw new Error('Klant niet gevonden.')
      }

      const dayEntries = await getEntriesForEmployeeDate(input.employeeId, input.date)
      const record = createTimeEntryRecord({
        ...input,
        sortOrder: input.sortOrder ?? dayEntries.length,
        clientName: input.clientName ?? client.name,
        breakMinutes:
          input.breakMinutes ?? (dayEntries.length === 0 ? DEFAULT_BREAK_MINUTES : 0),
      })

      await ensureLocationExists(record.location)
      await db.clients.update(client.id!, { lastUsedAt: new Date() })

      return db.timeEntries.add(record)
    })
  }

  const updateEntry = async (id: number, changes: Partial<TimeEntry>) => {
    await db.transaction('rw', db.timeEntries, db.clients, db.locations, async () => {
      const existingEntry = await db.timeEntries.get(id)

      if (!existingEntry) {
        throw new Error('Registratie niet gevonden.')
      }

      const nextClientId = changes.clientId ?? existingEntry.clientId
      const client = await db.clients.get(nextClientId)

      if (!client) {
        throw new Error('Klant niet gevonden.')
      }

      const nextLocation = changes.location ?? existingEntry.location
      await ensureLocationExists(nextLocation)

      await db.clients.update(client.id!, { lastUsedAt: new Date() })
      await db.timeEntries.update(id, {
        ...changes,
        clientName: changes.clientName ?? client.name,
      })
    })
  }

  const deleteEntry = async (id: number) => {
    await db.timeEntries.delete(id)
  }

  const repeatPreviousWorkday = async (targetDate: string) => {
    if (!employeeId) {
      throw new Error('Geen actief profiel geselecteerd.')
    }

    return db.transaction('rw', db.timeEntries, db.clients, db.locations, async () => {
      const sourceEntries = await getPreviousWorkdayEntries(employeeId, targetDate)

      if (sourceEntries.length === 0) {
        throw new Error('Geen vorige werkdag gevonden om te kopieren.')
      }

      const currentEntries = await getEntriesForEmployeeDate(employeeId, targetDate)

      if (currentEntries.length > 0) {
        throw new Error('Deze dag bevat al registraties.')
      }

      const now = new Date()

      for (const entry of sourceEntries) {
        await ensureLocationExists(entry.location)
        await db.clients.update(entry.clientId, { lastUsedAt: now })
        await db.timeEntries.add(
          createTimeEntryRecord({
            ...entry,
            employeeId,
            date: targetDate,
          }),
        )
      }
    })
  }

  return {
    entries: visibleEntries,
    previousWorkdayEntries: visiblePreviousWorkdayEntries,
    loading: visibleLoading,
    dayTotalMinutes: calculateDayTotalMinutes(visibleEntries),
    createEntry,
    updateEntry,
    deleteEntry,
    repeatPreviousWorkday,
  }
}
