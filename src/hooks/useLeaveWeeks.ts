import { liveQuery } from 'dexie'
import { useEffect, useMemo, useState } from 'react'

import { createLeaveWeekRecord, db } from '../db/database'
import { getWeekStartKey } from '../utils/weekHelpers'

type LeaveWeeksState = {
  weekStarts: string[]
  loading: boolean
}

const EMPTY_WEEK_STARTS: string[] = []

export function useLeaveWeeks(employeeId: number | null) {
  const [{ weekStarts, loading }, setState] = useState<LeaveWeeksState>({
    weekStarts: [],
    loading: employeeId !== null,
  })

  useEffect(() => {
    if (!employeeId) {
      return
    }

    const subscription = liveQuery(() =>
      db.leaveWeeks.where('employeeId').equals(employeeId).toArray(),
    ).subscribe({
      next: (rows) => {
        setState({
          weekStarts: rows.map((row) => row.weekStart),
          loading: false,
        })
      },
      error: (error) => {
        console.error('Failed to load leave weeks', error)
        setState({ weekStarts: [], loading: false })
      },
    })

    return () => subscription.unsubscribe()
  }, [employeeId])

  const visibleWeekStarts = employeeId ? weekStarts : EMPTY_WEEK_STARTS
  const visibleLoading = employeeId ? loading : false

  const leaveWeekStarts = useMemo(() => new Set(visibleWeekStarts), [visibleWeekStarts])

  const isLeaveWeek = (value: Date) => leaveWeekStarts.has(getWeekStartKey(value))

  const setLeaveWeek = async (value: Date, isLeave: boolean) => {
    if (!employeeId) {
      throw new Error('Geen actief profiel geselecteerd.')
    }

    const weekStart = getWeekStartKey(value)

    await db.transaction('rw', db.leaveWeeks, async () => {
      const existing = await db.leaveWeeks
        .where('[employeeId+weekStart]')
        .equals([employeeId, weekStart])
        .first()

      if (isLeave && !existing) {
        await db.leaveWeeks.add(createLeaveWeekRecord({ employeeId, weekStart }))
      } else if (!isLeave && existing?.id) {
        await db.leaveWeeks.delete(existing.id)
      }
    })
  }

  const toggleLeaveWeek = async (value: Date) => {
    await setLeaveWeek(value, !isLeaveWeek(value))
  }

  return {
    leaveWeekStarts,
    loading: visibleLoading,
    isLeaveWeek,
    setLeaveWeek,
    toggleLeaveWeek,
  }
}
