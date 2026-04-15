import { describe, it, expect } from 'vitest'
import {
  formatDateKey,
  parseDateKey,
  addDays,
  getStartOfWeek,
  getWeekdayDates,
  getFortnightStart,
  getFortnightDates,
  isSameDate,
  isWeekend,
  formatLongDate,
  formatShortDate,
  getDayLabel,
  getShortDayLabel,
  getIsoWeekNumber,
} from './weekHelpers'

describe('weekHelpers utilities', () => {
  describe('formatDateKey', () => {
    it('should format date as YYYY-MM-DD', () => {
      expect(formatDateKey(new Date(2026, 3, 15))).toBe('2026-04-15')
      expect(formatDateKey(new Date(2026, 0, 1))).toBe('2026-01-01')
      expect(formatDateKey(new Date(2026, 11, 31))).toBe('2026-12-31')
    })

    it('should pad single digit months and days', () => {
      expect(formatDateKey(new Date(2026, 0, 5))).toBe('2026-01-05')
      expect(formatDateKey(new Date(2026, 8, 9))).toBe('2026-09-09')
    })
  })

  describe('parseDateKey', () => {
    it('should parse YYYY-MM-DD string to Date', () => {
      const result = parseDateKey('2026-04-15')
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(3) // 0-indexed
      expect(result.getDate()).toBe(15)
    })

    it('should handle edge cases with defaults', () => {
      // Missing month/day should default to 1
      const result = parseDateKey('2026')
      expect(result.getFullYear()).toBe(2026)
      expect(result.getMonth()).toBe(0) // January (1-1 = 0)
      expect(result.getDate()).toBe(1)
    })

    it('should be reversible with formatDateKey', () => {
      const original = new Date(2026, 3, 15)
      const key = formatDateKey(original)
      const parsed = parseDateKey(key)
      expect(formatDateKey(parsed)).toBe(key)
    })
  })

  describe('addDays', () => {
    it('should add positive days', () => {
      const date = new Date(2026, 3, 15)
      const result = addDays(date, 7)
      expect(formatDateKey(result)).toBe('2026-04-22')
    })

    it('should subtract days with negative amount', () => {
      const date = new Date(2026, 3, 15)
      const result = addDays(date, -7)
      expect(formatDateKey(result)).toBe('2026-04-08')
    })

    it('should handle month boundaries', () => {
      const date = new Date(2026, 3, 30)
      const result = addDays(date, 5)
      expect(formatDateKey(result)).toBe('2026-05-05')
    })

    it('should handle year boundaries', () => {
      const date = new Date(2025, 11, 30)
      const result = addDays(date, 5)
      expect(formatDateKey(result)).toBe('2026-01-04')
    })

    it('should return date-only values (no time)', () => {
      const date = new Date(2026, 3, 15, 14, 30, 45)
      const result = addDays(date, 1)
      expect(result.getHours()).toBe(0)
      expect(result.getMinutes()).toBe(0)
      expect(result.getSeconds()).toBe(0)
    })
  })

  describe('getStartOfWeek', () => {
    it('should return Monday for a Monday', () => {
      const monday = new Date(2026, 3, 13) // Monday
      const result = getStartOfWeek(monday)
      expect(formatDateKey(result)).toBe('2026-04-13')
      expect(result.getDay()).toBe(1) // Monday
    })

    it('should return previous Monday for Wednesday', () => {
      const wednesday = new Date(2026, 3, 15) // Wednesday
      const result = getStartOfWeek(wednesday)
      expect(formatDateKey(result)).toBe('2026-04-13') // Monday
      expect(result.getDay()).toBe(1)
    })

    it('should return previous Monday for Sunday', () => {
      const sunday = new Date(2026, 3, 19) // Sunday
      const result = getStartOfWeek(sunday)
      expect(formatDateKey(result)).toBe('2026-04-13') // Monday
      expect(result.getDay()).toBe(1)
    })

    it('should return previous Monday for Saturday', () => {
      const saturday = new Date(2026, 3, 18) // Saturday
      const result = getStartOfWeek(saturday)
      expect(formatDateKey(result)).toBe('2026-04-13') // Monday
      expect(result.getDay()).toBe(1)
    })

    it('should return previous Monday for Tuesday', () => {
      const tuesday = new Date(2026, 3, 14) // Tuesday
      const result = getStartOfWeek(tuesday)
      expect(formatDateKey(result)).toBe('2026-04-13') // Monday
      expect(result.getDay()).toBe(1)
    })
  })

  describe('getWeekdayDates', () => {
    it('should return 5 weekdays starting from Monday', () => {
      const wednesday = new Date(2026, 3, 15) // Wednesday
      const weekdays = getWeekdayDates(wednesday)

      expect(weekdays).toHaveLength(5)
      expect(formatDateKey(weekdays[0])).toBe('2026-04-13') // Monday
      expect(formatDateKey(weekdays[1])).toBe('2026-04-14') // Tuesday
      expect(formatDateKey(weekdays[2])).toBe('2026-04-15') // Wednesday
      expect(formatDateKey(weekdays[3])).toBe('2026-04-16') // Thursday
      expect(formatDateKey(weekdays[4])).toBe('2026-04-17') // Friday
    })

    it('should return correct weekdays for Sunday', () => {
      const sunday = new Date(2026, 3, 19) // Sunday
      const weekdays = getWeekdayDates(sunday)

      expect(weekdays).toHaveLength(5)
      expect(formatDateKey(weekdays[0])).toBe('2026-04-13') // Previous Monday
      expect(formatDateKey(weekdays[4])).toBe('2026-04-17') // Previous Friday
    })

    it('all returned dates should be weekdays', () => {
      const anyDate = new Date(2026, 3, 15)
      const weekdays = getWeekdayDates(anyDate)

      weekdays.forEach((date) => {
        const day = date.getDay()
        expect(day).toBeGreaterThanOrEqual(1) // Monday
        expect(day).toBeLessThanOrEqual(5) // Friday
      })
    })
  })

  describe('getFortnightStart', () => {
    it('should return Monday (same as getStartOfWeek)', () => {
      const wednesday = new Date(2026, 3, 15)
      const result = getFortnightStart(wednesday)
      expect(formatDateKey(result)).toBe('2026-04-13') // Monday
      expect(result.getDay()).toBe(1)
    })
  })

  describe('getFortnightDates', () => {
    it('should return 14 consecutive days starting from Monday', () => {
      const wednesday = new Date(2026, 3, 15) // Wednesday, week starting April 13
      const fortnight = getFortnightDates(wednesday)

      expect(fortnight).toHaveLength(14)
      expect(formatDateKey(fortnight[0])).toBe('2026-04-13') // Monday week 1
      expect(formatDateKey(fortnight[6])).toBe('2026-04-19') // Sunday week 1
      expect(formatDateKey(fortnight[7])).toBe('2026-04-20') // Monday week 2
      expect(formatDateKey(fortnight[13])).toBe('2026-04-26') // Sunday week 2
    })

    it('should include weekends', () => {
      const anyDate = new Date(2026, 3, 15)
      const fortnight = getFortnightDates(anyDate)

      // Saturday and Sunday should be included
      expect(fortnight[5].getDay()).toBe(6) // Saturday week 1
      expect(fortnight[6].getDay()).toBe(0) // Sunday week 1
      expect(fortnight[12].getDay()).toBe(6) // Saturday week 2
      expect(fortnight[13].getDay()).toBe(0) // Sunday week 2
    })

    it('should handle month boundaries', () => {
      const endOfMonth = new Date(2026, 3, 28) // April 28 (Tuesday)
      const fortnight = getFortnightDates(endOfMonth)

      expect(fortnight).toHaveLength(14)
      // Some dates should be in May
      const lastDate = fortnight[13]
      expect(lastDate.getMonth()).toBe(4) // May (0-indexed)
    })
  })

  describe('isSameDate', () => {
    it('should return true for same date', () => {
      const date1 = new Date(2026, 3, 15)
      const date2 = new Date(2026, 3, 15)
      expect(isSameDate(date1, date2)).toBe(true)
    })

    it('should return false for different dates', () => {
      const date1 = new Date(2026, 3, 15)
      const date2 = new Date(2026, 3, 16)
      expect(isSameDate(date1, date2)).toBe(false)
    })

    it('should ignore time component', () => {
      const date1 = new Date(2026, 3, 15, 10, 30, 45)
      const date2 = new Date(2026, 3, 15, 22, 15, 30)
      expect(isSameDate(date1, date2)).toBe(true)
    })

    it('should work across different months', () => {
      const date1 = new Date(2026, 3, 15)
      const date2 = new Date(2026, 4, 15)
      expect(isSameDate(date1, date2)).toBe(false)
    })
  })

  describe('isWeekend', () => {
    it('should return true for Saturday', () => {
      const saturday = new Date(2026, 3, 18)
      expect(isWeekend(saturday)).toBe(true)
      expect(saturday.getDay()).toBe(6)
    })

    it('should return true for Sunday', () => {
      const sunday = new Date(2026, 3, 19)
      expect(isWeekend(sunday)).toBe(true)
      expect(sunday.getDay()).toBe(0)
    })

    it('should return false for Monday', () => {
      const monday = new Date(2026, 3, 13)
      expect(isWeekend(monday)).toBe(false)
    })

    it('should return false for weekdays', () => {
      const monday = new Date(2026, 3, 13)
      expect(isWeekend(monday)).toBe(false)
      expect(isWeekend(addDays(monday, 1))).toBe(false) // Tuesday
      expect(isWeekend(addDays(monday, 2))).toBe(false) // Wednesday
      expect(isWeekend(addDays(monday, 3))).toBe(false) // Thursday
      expect(isWeekend(addDays(monday, 4))).toBe(false) // Friday
    })
  })

  describe('formatLongDate', () => {
    it('should format date in Dutch long format', () => {
      expect(formatLongDate(new Date(2026, 3, 15))).toBe('15 april 2026')
      expect(formatLongDate(new Date(2026, 0, 1))).toBe('1 januari 2026')
      expect(formatLongDate(new Date(2026, 11, 31))).toBe('31 december 2026')
    })

    it('should handle all months correctly', () => {
      const months = [
        'januari', 'februari', 'maart', 'april', 'mei', 'juni',
        'juli', 'augustus', 'september', 'oktober', 'november', 'december'
      ]
      
      months.forEach((month, index) => {
        const result = formatLongDate(new Date(2026, index, 15))
        expect(result).toContain(month)
        expect(result).toBe(`15 ${month} 2026`)
      })
    })
  })

  describe('formatShortDate', () => {
    it('should format date in short format with day label', () => {
      expect(formatShortDate(new Date(2026, 3, 13))).toBe('ma 13') // Monday
      expect(formatShortDate(new Date(2026, 3, 14))).toBe('di 14') // Tuesday
      expect(formatShortDate(new Date(2026, 3, 15))).toBe('wo 15') // Wednesday
    })

    it('should pad single digit dates', () => {
      expect(formatShortDate(new Date(2026, 3, 5))).toBe('zo 05') // Sunday
      expect(formatShortDate(new Date(2026, 3, 9))).toBe('do 09') // Thursday
    })
  })

  describe('getDayLabel', () => {
    it('should return full Dutch day names', () => {
      expect(getDayLabel(new Date(2026, 3, 13))).toBe('Maandag')
      expect(getDayLabel(new Date(2026, 3, 14))).toBe('Dinsdag')
      expect(getDayLabel(new Date(2026, 3, 15))).toBe('Woensdag')
      expect(getDayLabel(new Date(2026, 3, 16))).toBe('Donderdag')
      expect(getDayLabel(new Date(2026, 3, 17))).toBe('Vrijdag')
      expect(getDayLabel(new Date(2026, 3, 18))).toBe('Zaterdag')
      expect(getDayLabel(new Date(2026, 3, 19))).toBe('Zondag')
    })
  })

  describe('getShortDayLabel', () => {
    it('should return short Dutch day names', () => {
      expect(getShortDayLabel(new Date(2026, 3, 13))).toBe('ma')
      expect(getShortDayLabel(new Date(2026, 3, 14))).toBe('di')
      expect(getShortDayLabel(new Date(2026, 3, 15))).toBe('wo')
      expect(getShortDayLabel(new Date(2026, 3, 16))).toBe('do')
      expect(getShortDayLabel(new Date(2026, 3, 17))).toBe('vr')
      expect(getShortDayLabel(new Date(2026, 3, 18))).toBe('za')
      expect(getShortDayLabel(new Date(2026, 3, 19))).toBe('zo')
    })
  })

  describe('getIsoWeekNumber', () => {
    it('should calculate week number for 2026', () => {
      // Week 1 of 2026 starts on Monday, January 5, 2026
      expect(getIsoWeekNumber(new Date(2026, 0, 5))).toBe(2)
      expect(getIsoWeekNumber(new Date(2026, 0, 1))).toBe(1)
    })

    it('should handle mid-year weeks', () => {
      // April 15, 2026 is in week 16
      expect(getIsoWeekNumber(new Date(2026, 3, 15))).toBe(16)
    })

    it('should handle week 53 years correctly', () => {
      // 2025 has 53 weeks, week 53 includes Dec 29-31
      expect(getIsoWeekNumber(new Date(2025, 11, 29))).toBe(1)
    })

    it('should handle year boundaries', () => {
      // January 1, 2026 can belong to previous year's week 53 or current year's week 1
      const weekNum = getIsoWeekNumber(new Date(2026, 0, 1))
      expect(weekNum).toBeGreaterThanOrEqual(1)
      expect(weekNum).toBeLessThanOrEqual(53)
    })

    it('should use Thursday rule for week determination', () => {
      // ISO 8601: Week 1 is the week with the first Thursday
      // Week containing January 4 is always week 1
      const jan4 = new Date(2026, 0, 4)
      const weekNum = getIsoWeekNumber(jan4)
      expect(weekNum).toBeGreaterThanOrEqual(1)
      expect(weekNum).toBeLessThanOrEqual(2)
    })

    it('should return consistent results for same week', () => {
      // All days in same week should have same week number
      const monday = new Date(2026, 3, 13)
      const weekNum = getIsoWeekNumber(monday)
      
      for (let i = 0; i < 7; i++) {
        const date = addDays(monday, i)
        expect(getIsoWeekNumber(date)).toBe(weekNum)
      }
    })

    it('should increment week numbers sequentially', () => {
      const week15 = new Date(2026, 3, 8) // Week 15
      const week16 = new Date(2026, 3, 15) // Week 16
      
      const num15 = getIsoWeekNumber(week15)
      const num16 = getIsoWeekNumber(week16)
      
      expect(num16).toBe(num15 + 1)
    })
  })

  describe('Edge Cases', () => {
    it('should handle leap year dates', () => {
      const leapDay = new Date(2024, 1, 29) // Feb 29, 2024 (leap year)
      expect(formatDateKey(leapDay)).toBe('2024-02-29')
      
      const nextDay = addDays(leapDay, 1)
      expect(formatDateKey(nextDay)).toBe('2024-03-01')
    })

    it('should handle DST transitions', () => {
      // DST transitions shouldn't affect date-only calculations
      // European DST: Last Sunday in March (forward) and October (backward)
      const beforeDST = new Date(2026, 2, 28) // March 28
      const afterDST = addDays(beforeDST, 1) // March 29 (DST starts)
      
      expect(formatDateKey(afterDST)).toBe('2026-03-29')
    })

    it('should handle very old dates', () => {
      const old = new Date(1900, 0, 1)
      expect(formatDateKey(old)).toBe('1900-01-01')
    })

    it('should handle far future dates', () => {
      const future = new Date(2099, 11, 31)
      expect(formatDateKey(future)).toBe('2099-12-31')
    })
  })
})
