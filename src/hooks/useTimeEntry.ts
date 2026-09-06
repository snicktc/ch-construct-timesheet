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
import { ensureLocationExists } from '../db/locations'
import { sortEntries } from '../utils/entryGrouping'
import { calculateDayTotalMinutes } from '../utils/timeCalc'

type TimeEntriesState = {
  entries: TimeEntry[]
  previousWorkdayEntries: TimeEntry[]
  loading: boolean
}

export type SaveTimeEntryInput = Omit<NewTimeEntryInput, 'sortOrder' | 'clientName' | 'breakMinutes'> &
  Partial<Pick<TimeEntry, 'sortOrder' | 'clientName' | 'breakMinutes'>>

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
    const { entryId, clientId } = await db.transaction('rw', db.timeEntries, db.clients, db.locations, async () => {
      const client = await db.clients.get(input.clientId)

      if (!client) {
        throw new Error('Klant niet gevonden.')
      }

      // Derive sortOrder from the database inside the transaction rather than
      // from the (possibly stale) liveQuery state, so that two saves fired in
      // quick succession never end up with the same sortOrder.
      const existingDayEntries = await db.timeEntries
        .where('[employeeId+date]')
        .equals([input.employeeId, input.date])
        .toArray()
      const isFirstEntryOfDay = existingDayEntries.length === 0
      const nextSortOrder = isFirstEntryOfDay
        ? 0
        : Math.max(...existingDayEntries.map((entry) => entry.sortOrder)) + 1

      const record = createTimeEntryRecord({
        ...input,
        sortOrder: input.sortOrder ?? nextSortOrder,
        clientName: input.clientName ?? client.name,
        breakMinutes: input.breakMinutes ?? (isFirstEntryOfDay ? DEFAULT_BREAK_MINUTES : 0),
      })

      await ensureLocationExists(record.location)
      const newEntryId = await db.timeEntries.add(record)

      return { entryId: newEntryId, clientId: client.id! }
    })

    // Update client lastUsedAt with error handling
    db.clients.update(clientId, { lastUsedAt: new Date() }).catch((error) => {
      console.error('Failed to update client lastUsedAt', { clientId, error })
    })

    return entryId
  }

  const updateEntry = async (id: number, changes: Partial<TimeEntry>) => {
    const clientIdToUpdate = await db.transaction('rw', db.timeEntries, db.clients, db.locations, async () => {
      const existingEntry = await db.timeEntries.get(id)

      if (!existingEntry) {
        throw new Error('Registratie niet gevonden.')
      }

      const isClientChanging = changes.clientId !== undefined && changes.clientId !== existingEntry.clientId
      const nextClientId = changes.clientId ?? existingEntry.clientId
      const client = await db.clients.get(nextClientId)

      // Only require the client to exist when the user actually switches client.
      // Entries that reference a client that no longer exists (e.g. from an old
      // backup) must remain editable for the other fields.
      if (isClientChanging && !client) {
        throw new Error('Klant niet gevonden.')
      }

      const nextLocation = changes.location ?? existingEntry.location
      await ensureLocationExists(nextLocation)

      await db.timeEntries.update(id, {
        ...changes,
        clientName: changes.clientName ?? client?.name ?? existingEntry.clientName,
      })

      return client?.id ?? null
    })

    if (clientIdToUpdate !== null) {
      db.clients.update(clientIdToUpdate, { lastUsedAt: new Date() }).catch((error) => {
        console.error('Failed to update client lastUsedAt', { clientId: clientIdToUpdate, error })
      })
    }
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

      const uniqueLocations = [...new Set(sourceEntries.map((e) => e.location))]
      const uniqueClientIds = [...new Set(sourceEntries.map((e) => e.clientId))]

      const locationChecks = await Promise.all(
        uniqueLocations.map((loc) => db.locations.where('name').equals(loc.trim()).first()),
      )

      const missingLocations = uniqueLocations.filter((loc, idx) => loc.trim() && !locationChecks[idx])
      if (missingLocations.length > 0) {
        await db.locations.bulkAdd(missingLocations.map((name) => createLocationRecord({ name })))
      }

      // Dexie's update() resolves to 0 for ids that no longer exist, so entries
      // that reference a deleted client are copied without failing.
      await Promise.all(uniqueClientIds.map((id) => db.clients.update(id, { lastUsedAt: now })))

      await db.timeEntries.bulkAdd(
        sourceEntries.map((entry) =>
          createTimeEntryRecord({
            ...entry,
            employeeId,
            date: targetDate,
          }),
        ),
      )
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
