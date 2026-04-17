import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createEmployeeRecord, db } from '../db/database'
import { setupTestDb, teardownTestDb } from '../../tests/helpers/dbHelpers'
import { ACTIVE_PROFILE_STORAGE_KEY } from '../utils/storageKeys'
import { useActiveProfile } from './useActiveProfile'

const requireNumericId = (value: number | undefined) => {
  if (typeof value !== 'number') {
    throw new Error('Expected Dexie add() to return a numeric id')
  }

  return value
}

describe('useActiveProfile', () => {
  beforeEach(async () => {
    await setupTestDb()
    window.localStorage.clear()
  })

  afterEach(async () => {
    await teardownTestDb()
    window.localStorage.clear()
  })

  it('ignores invalid localStorage values', async () => {
    window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, 'not-a-number')

    const { result } = renderHook(() => useActiveProfile())

    await waitFor(() => {
      expect(result.current.activeEmployeeId).toBeNull()
      expect(result.current.activeEmployee).toBeNull()
    })
  })

  it('restores the active employee from localStorage', async () => {
    const employeeId = requireNumericId(await db.employees.add(
      createEmployeeRecord({ name: 'Milan', exportRecipient: 'CH Construct' }),
    ))
    window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, String(employeeId))

    const { result } = renderHook(() => useActiveProfile())

    await waitFor(() => {
      expect(result.current.activeEmployeeId).toBe(employeeId)
      expect(result.current.activeEmployee?.name).toBe('Milan')
    })
  })

  it('returns a missing employee as null while keeping the stored id', async () => {
    window.localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, '99')

    const { result } = renderHook(() => useActiveProfile())

    await waitFor(() => {
      expect(result.current.activeEmployeeId).toBe(99)
      expect(result.current.activeEmployee).toBeNull()
    })
  })

  it('persists a newly selected active employee id', async () => {
    const employeeId = requireNumericId(await db.employees.add(
      createEmployeeRecord({ name: 'Milan', exportRecipient: 'CH Construct' }),
    ))

    const { result } = renderHook(() => useActiveProfile())

    await act(async () => {
      result.current.setActiveEmployeeId(employeeId)
    })

    await waitFor(() => {
      expect(window.localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY)).toBe(String(employeeId))
      expect(result.current.activeEmployee?.name).toBe('Milan')
    })
  })
})
