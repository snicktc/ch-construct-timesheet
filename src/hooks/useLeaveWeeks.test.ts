import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'

import { useLeaveWeeks } from './useLeaveWeeks'
import { db } from '../db/database'
import { getWeekStartKey } from '../utils/weekHelpers'
import { setupTestDb, teardownTestDb } from '../../tests/helpers/dbHelpers'

// A Wednesday; its ISO week starts on Monday 2026-03-09.
const WEEK_A = new Date(2026, 2, 11)
const WEEK_A_START = getWeekStartKey(WEEK_A)

describe('useLeaveWeeks Hook', () => {
  beforeEach(async () => {
    await setupTestDb()
  })

  afterEach(async () => {
    await teardownTestDb()
  })

  it('starts loading and resolves to empty set', async () => {
    const { result } = renderHook(() => useLeaveWeeks(1))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.leaveWeekStarts.size).toBe(0)
    expect(result.current.isLeaveWeek(WEEK_A)).toBe(false)
  })

  it('returns empty and not loading when employeeId is null', async () => {
    const { result } = renderHook(() => useLeaveWeeks(null))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.leaveWeekStarts.size).toBe(0)
  })

  it('marks a week as leave using the Monday week-start key', async () => {
    const { result } = renderHook(() => useLeaveWeeks(1))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.setLeaveWeek(WEEK_A, true)
    })

    await waitFor(() => {
      expect(result.current.isLeaveWeek(WEEK_A)).toBe(true)
    })

    const stored = await db.leaveWeeks.where('employeeId').equals(1).toArray()
    expect(stored).toHaveLength(1)
    expect(stored[0].weekStart).toBe(WEEK_A_START)
  })

  it('does not create duplicate records for the same week', async () => {
    const { result } = renderHook(() => useLeaveWeeks(1))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.setLeaveWeek(WEEK_A, true)
      await result.current.setLeaveWeek(new Date(2026, 2, 13), true) // Friday, same week
    })

    await waitFor(() => {
      expect(result.current.isLeaveWeek(WEEK_A)).toBe(true)
    })

    const count = await db.leaveWeeks.where('employeeId').equals(1).count()
    expect(count).toBe(1)
  })

  it('toggles a leave week on and off', async () => {
    const { result } = renderHook(() => useLeaveWeeks(1))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.toggleLeaveWeek(WEEK_A)
    })
    await waitFor(() => {
      expect(result.current.isLeaveWeek(WEEK_A)).toBe(true)
    })

    await act(async () => {
      await result.current.toggleLeaveWeek(WEEK_A)
    })
    await waitFor(() => {
      expect(result.current.isLeaveWeek(WEEK_A)).toBe(false)
    })

    const count = await db.leaveWeeks.where('employeeId').equals(1).count()
    expect(count).toBe(0)
  })

  it('scopes leave weeks per employee', async () => {
    const { result } = renderHook(() => useLeaveWeeks(1))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    await act(async () => {
      await result.current.setLeaveWeek(WEEK_A, true)
    })

    const otherEmployee = renderHook(() => useLeaveWeeks(2))
    await waitFor(() => {
      expect(otherEmployee.result.current.loading).toBe(false)
    })

    expect(otherEmployee.result.current.isLeaveWeek(WEEK_A)).toBe(false)
  })
})
