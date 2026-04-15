import { vi } from 'vitest'

/**
 * Mock current date for testing
 * @param date - Date to set as "now"
 */
export const mockCurrentDate = (date: Date | string) => {
  const mockDate = typeof date === 'string' ? new Date(date) : date
  vi.useFakeTimers()
  vi.setSystemTime(mockDate)
  return mockDate
}

/**
 * Restore real timers
 */
export const restoreRealTime = () => {
  vi.useRealTimers()
}

/**
 * Create a date from YYYY-MM-DD string
 */
export const createDate = (dateString: string): Date => {
  return new Date(dateString + 'T00:00:00Z')
}

/**
 * Get date N days from now (or from provided date)
 */
export const getDaysFromNow = (days: number, from?: Date): Date => {
  const baseDate = from || new Date()
  const result = new Date(baseDate)
  result.setDate(result.getDate() + days)
  return result
}

/**
 * Format date as YYYY-MM-DD for testing
 */
export const formatTestDate = (date: Date): string => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Get Monday of current week
 */
export const getMonday = (date: Date = new Date()): Date => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

/**
 * Get specific weekday from a given date
 * @param date - Base date
 * @param targetDay - 0=Sunday, 1=Monday, ..., 6=Saturday
 */
export const getWeekday = (date: Date, targetDay: number): Date => {
  const monday = getMonday(date)
  const result = new Date(monday)
  const offset = targetDay === 0 ? 6 : targetDay - 1
  result.setDate(monday.getDate() + offset)
  return result
}

/**
 * Check if date is a weekend
 */
export const isWeekendDay = (date: Date): boolean => {
  const day = date.getDay()
  return day === 0 || day === 6
}

/**
 * Create a series of dates for testing
 */
export const createDateRange = (start: Date, days: number): Date[] => {
  const dates: Date[] = []
  for (let i = 0; i < days; i++) {
    const date = new Date(start)
    date.setDate(start.getDate() + i)
    dates.push(date)
  }
  return dates
}
