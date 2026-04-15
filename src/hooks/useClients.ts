import { liveQuery } from 'dexie'
import { useEffect, useState } from 'react'

import {
  type Client,
  type NewClientInput,
  createClientRecord,
  createLocationRecord,
  db,
} from '../db/database'

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

const syncLocationName = async (locationName: string) => {
  const trimmedLocationName = locationName.trim()

  if (!trimmedLocationName) {
    return
  }

  const existingLocation = await db.locations.where('name').equals(trimmedLocationName).first()

  if (!existingLocation) {
    await db.locations.add(createLocationRecord({ name: trimmedLocationName }))
  }
}

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
      await syncLocationName(input.defaultLocation)
      return db.clients.add(createClientRecord(input))
    })
  }

  const updateClient = async (id: number, changes: Partial<Client>) => {
    await db.transaction('rw', db.clients, db.locations, async () => {
      if (changes.defaultLocation !== undefined) {
        await syncLocationName(changes.defaultLocation)
      }

      await db.clients.update(id, changes)
    })
  }

  const deleteClient = async (id: number) => {
    await db.clients.delete(id)
  }

  return {
    clients,
    loading,
    createClient,
    updateClient,
    deleteClient,
  }
}
