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

  const existingLocation = await db.locations.where('name').equals(trimmedLocationName).first()

  if (!existingLocation) {
    await db.locations.add(createLocationRecord({ name: trimmedLocationName }))
  }
}

const getEntriesForEmployeeDate = async (employeeId: number, date: string) => {
  const entries = await db.timeEntries.where('[employeeId+date]').equals([employeeId, date]).toArray()
  return sortEntries(entries)
}

const getPreviousWorkdayEntries = async (employeeId: number, date: string) => {
  const previousEntry = await db.timeEntries
    .where('[employeeId+date]')
    .between([employeeId, Dexie.minKey], [employeeId, date], false, false)
    .last()

  if (!previousEntry) {
    return []
  }

  return getEntriesForEmployeeDate(employeeId, previousEntry.date)
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
    const currentDayCount = entries.length

    const { entryId, clientId } = await db.transaction('rw', db.timeEntries, db.locations, async () => {
      const client = await db.clients.get(input.clientId)

      if (!client) {
        throw new Error('Klant niet gevonden.')
      }

      const record = createTimeEntryRecord({
        ...input,
        sortOrder: input.sortOrder ?? currentDayCount,
        clientName: input.clientName ?? client.name,
        breakMinutes:
          input.breakMinutes ?? (currentDayCount === 0 ? DEFAULT_BREAK_MINUTES : 0),
      })

      await ensureLocationExists(record.location)
      const newEntryId = await db.timeEntries.add(record)

      return { entryId: newEntryId, clientId: client.id! }
    })

    void db.clients.update(clientId, { lastUsedAt: new Date() })

    return entryId
  }

  const updateEntry = async (id: number, changes: Partial<TimeEntry>) => {
    const clientIdToUpdate = await db.transaction('rw', db.timeEntries, db.locations, async () => {
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

      await db.timeEntries.update(id, {
        ...changes,
        clientName: changes.clientName ?? client.name,
      })

      return client.id!
    })

    void db.clients.update(clientIdToUpdate, { lastUsedAt: new Date() })
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
