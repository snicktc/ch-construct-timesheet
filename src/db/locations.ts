import { createLocationRecord, db } from './database'

/**
 * Adds `locationName` to the locations table when it is not yet known.
 * Blank names are ignored. Safe to call inside a Dexie transaction that
 * includes `db.locations`.
 */
export const ensureLocationExists = async (locationName: string) => {
  const trimmedLocationName = locationName.trim()

  if (!trimmedLocationName) {
    return
  }

  const existingLocation = await db.locations.where('name').equals(trimmedLocationName).first()

  if (!existingLocation) {
    await db.locations.add(createLocationRecord({ name: trimmedLocationName }))
  }
}
