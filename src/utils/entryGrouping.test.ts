import { describe, expect, it } from 'vitest'

import { groupEntriesByDate, sortEntries } from './entryGrouping'

describe('entryGrouping', () => {
  it('sortEntries returns a new array ordered by sortOrder', () => {
    const input = [
      { id: 1, sortOrder: 2 },
      { id: 2, sortOrder: 0 },
      { id: 3, sortOrder: 1 },
    ]

    const sorted = sortEntries(input)

    expect(sorted.map((entry) => entry.id)).toEqual([2, 3, 1])
    expect(sorted).not.toBe(input)
    expect(input.map((entry) => entry.id)).toEqual([1, 2, 3])
  })

  it('groupEntriesByDate groups per date and sorts each group', () => {
    const grouped = groupEntriesByDate([
      { id: 1, date: '2026-04-07', sortOrder: 1 },
      { id: 2, date: '2026-04-06', sortOrder: 0 },
      { id: 3, date: '2026-04-07', sortOrder: 0 },
    ])

    expect([...grouped.keys()]).toEqual(['2026-04-07', '2026-04-06'])
    expect(grouped.get('2026-04-07')?.map((entry) => entry.id)).toEqual([3, 1])
    expect(grouped.get('2026-04-06')?.map((entry) => entry.id)).toEqual([2])
    expect(grouped.has('2026-04-08')).toBe(false)
  })

  it('groupEntriesByDate returns an empty map for no entries', () => {
    expect(groupEntriesByDate([]).size).toBe(0)
  })
})
