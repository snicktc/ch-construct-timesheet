import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'

import {
  type Client,
  type NewClientInput,
  createClientRecord,
  db,
} from '../db/database'
import { ensureLocationExists } from '../db/locations'

type ClientsState = {
  clients: Client[]
  loading: boolean
}

const sortClients = (clients: Client[]) =>
  [...clients].sort((left, right) => {
    const leftTime = left.lastUsedAt?.getTime() ?? 0
    const rightTime = right.lastUsedAt?.getTime() ?? 0

    if (leftTime !== rightTime) {
      return rightTime - leftTime
    }

    return left.name.localeCompare(right.name, 'nl-BE')
  })

export function useClients() {
  const [{ clients, loading }, setState] = useState<ClientsState>({
    clients: [],
    loading: true,
  })

  useEffect(() => {
    const subscription = liveQuery(() => db.clients.toArray()).subscribe({
      next: (nextClients) => {
        setState({
          clients: sortClients(nextClients),
          loading: false,
        })
      },
      error: (error) => {
        console.error('Failed to load clients', error)
        setState((current) => ({
          ...current,
          loading: false,
        }))
      },
    })

    return () => subscription.unsubscribe()
  }, [])

  const createClient = async (input: NewClientInput) => {
    return db.transaction('rw', db.clients, db.locations, async () => {
      await ensureLocationExists(input.defaultLocation)
      return db.clients.add(createClientRecord(input))
    })
  }

  const updateClient = async (id: number, changes: Partial<Client>) => {
    await db.transaction('rw', db.clients, db.locations, async () => {
      if (changes.defaultLocation !== undefined) {
        await ensureLocationExists(changes.defaultLocation)
      }

      await db.clients.update(id, changes)
    })
  }

  const deleteClient = async (id: number) => {
    await db.transaction('rw', db.clients, db.timeEntries, async () => {
      const timeEntryCount = await db.timeEntries.where('clientId').equals(id).count()

      if (timeEntryCount > 0) {
        throw new Error('Klant heeft registraties en kan niet verwijderd worden.')
      }

      await db.clients.delete(id)
    })
  }

  return {
    clients,
    loading,
    createClient,
    updateClient,
    deleteClient,
  }
}
