import type { TimeEntry } from '../db/database'

/** Returns a new array sorted by `sortOrder` (ascending). */
export const sortEntries = <T extends Pick<TimeEntry, 'sortOrder'>>(entries: T[]) =>
  [...entries].sort((left, right) => left.sortOrder - right.sortOrder)

/** Groups entries per `date` key; each group is sorted by `sortOrder`. */
export const groupEntriesByDate = <T extends Pick<TimeEntry, 'date' | 'sortOrder'>>(entries: T[]) => {
  const grouped = new Map<string, T[]>()

  for (const entry of entries) {
    const current = grouped.get(entry.date) ?? []
    current.push(entry)
    grouped.set(entry.date, current)
  }

  for (const [date, dateEntries] of grouped) {
    grouped.set(date, sortEntries(dateEntries))
  }

  return grouped
}
