import { describe, it, expect } from 'vitest'
import { parseTimeToMinutes, formatMinutesAsHours, calculateEntryMinutes, calculateDayTotalMinutes } from './timeCalc'

describe('timeCalc utilities', () => {
  describe('parseTimeToMinutes', () => {
    it('should parse normal time correctly', () => {
      expect(parseTimeToMinutes('08:30')).toBe(510)
      expect(parseTimeToMinutes('06:30')).toBe(390)
      expect(parseTimeToMinutes('17:00')).toBe(1020)
    })

    it('should handle midnight', () => {
      expect(parseTimeToMinutes('00:00')).toBe(0)
    })

    it('should handle end of day', () => {
      expect(parseTimeToMinutes('23:59')).toBe(1439)
    })

    it('should return 0 for invalid input', () => {
      expect(parseTimeToMinutes('invalid')).toBe(0)
      expect(parseTimeToMinutes('')).toBe(0)
    })

    it('should parse times even with invalid hours (no validation)', () => {
      // Note: Current implementation doesn't validate hours/minutes ranges
      // This is expected behavior - validation happens elsewhere
      expect(parseTimeToMinutes('25:00')).toBe(1500) // 25 * 60
    })
  })

  describe('formatMinutesAsHours', () => {
    it('should format minutes as HH:mm', () => {
      expect(formatMinutesAsHours(510)).toBe('08:30')
      expect(formatMinutesAsHours(390)).toBe('06:30')
      expect(formatMinutesAsHours(1020)).toBe('17:00')
    })

    it('should handle 0 minutes', () => {
      expect(formatMinutesAsHours(0)).toBe('00:00')
    })

    it('should handle negative values by clamping to 0', () => {
      expect(formatMinutesAsHours(-60)).toBe('00:00')
      expect(formatMinutesAsHours(-500)).toBe('00:00')
    })

    it('should round floating point values', () => {
      expect(formatMinutesAsHours(510.7)).toBe('08:31')
      expect(formatMinutesAsHours(510.4)).toBe('08:30')
    })
  })

  describe('calculateEntryMinutes', () => {
    it('should calculate entry minutes correctly', () => {
      const entry = {
        startTime: '08:00',
        endTime: '17:00',
        breakMinutes: 45,
        travelCreditMinutes: 0,
      }
      // 9 hours = 540 min - 45 break = 495
      expect(calculateEntryMinutes(entry)).toBe(495)
    })

    it('should include travel credit in calculation', () => {
      const entry = {
        startTime: '06:30',
        endTime: '15:30',
        breakMinutes: 45,
        travelCreditMinutes: 30,
      }
      // 9 hours = 540 min - 45 break - 30 travel = 465
      expect(calculateEntryMinutes(entry)).toBe(465)
    })

    it('should return 0 for negative results', () => {
      const entry = {
        startTime: '08:00',
        endTime: '09:00',
        breakMinutes: 120,
        travelCreditMinutes: 0,
      }
      // 1 hour = 60 min - 120 break = -60 -> clamped to 0
      expect(calculateEntryMinutes(entry)).toBe(0)
    })

    it('should handle no break or travel credit', () => {
      const entry = {
        startTime: '08:00',
        endTime: '10:00',
        breakMinutes: 0,
        travelCreditMinutes: 0,
      }
      expect(calculateEntryMinutes(entry)).toBe(120)
    })
  })

  describe('calculateDayTotalMinutes', () => {
    it('should sum multiple entries', () => {
      const entries = [
        {
          startTime: '08:00',
          endTime: '12:00',
          breakMinutes: 0,
          travelCreditMinutes: 0,
        },
        {
          startTime: '13:00',
          endTime: '17:00',
          breakMinutes: 0,
          travelCreditMinutes: 0,
        },
      ]
      // 4 hours + 4 hours = 8 hours = 480 minutes
      expect(calculateDayTotalMinutes(entries)).toBe(480)
    })

    it('should handle empty array', () => {
      expect(calculateDayTotalMinutes([])).toBe(0)
    })

    it('should handle single entry with breaks and travel', () => {
      const entries = [
        {
          startTime: '06:30',
          endTime: '15:30',
          breakMinutes: 45,
          travelCreditMinutes: 30,
        },
      ]
      // 9 hours = 540 - 45 - 30 = 465
      expect(calculateDayTotalMinutes(entries)).toBe(465)
    })
  })
})
