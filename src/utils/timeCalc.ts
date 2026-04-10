import type { TimeEntry } from '../db/database'

export const parseTimeToMinutes = (value: string) => {
  const [hours, minutes] = value.split(':').map(Number)

  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
    return 0
  }

  return hours * 60 + minutes
}

export const formatMinutesAsHours = (totalMinutes: number) => {
  const safeMinutes = Math.max(0, Math.round(totalMinutes))
  const hours = Math.floor(safeMinutes / 60)
  const minutes = safeMinutes % 60

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export const calculateEntryMinutes = (entry: Pick<TimeEntry, 'startTime' | 'endTime' | 'breakMinutes' | 'travelCreditMinutes'>) => {
  const grossMinutes = parseTimeToMinutes(entry.endTime) - parseTimeToMinutes(entry.startTime)
  return Math.max(0, grossMinutes - entry.breakMinutes - entry.travelCreditMinutes)
}

export const calculateDayTotalMinutes = (entries: Array<
  Pick<TimeEntry, 'startTime' | 'endTime' | 'breakMinutes' | 'travelCreditMinutes'>
>) => entries.reduce((total, entry) => total + calculateEntryMinutes(entry), 0)
