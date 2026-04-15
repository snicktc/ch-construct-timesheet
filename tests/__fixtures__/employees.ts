import type { Employee } from '../../src/db/database'

export const mockEmployees: Omit<Employee, 'id'>[] = [
  {
    name: 'Jan Janssen',
    exportRecipient: 'CH Construct',
    exportLogo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    defaultBreakMinutes: 45,
    defaultStartTime: '06:30',
    sortOrder: 0,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    name: 'Piet Pietersen',
    exportRecipient: 'VBW',
    exportLogo: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==',
    defaultBreakMinutes: 30,
    defaultStartTime: '07:00',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date('2026-01-15T00:00:00Z'),
  },
  {
    name: 'Klaas de Vries',
    exportRecipient: 'CH Construct',
    exportLogo: '',
    defaultBreakMinutes: 45,
    defaultStartTime: '06:30',
    sortOrder: 2,
    isActive: false,
    createdAt: new Date('2025-12-01T00:00:00Z'),
  },
]

export const createMockEmployee = (overrides: Partial<Omit<Employee, 'id'>> = {}): Omit<Employee, 'id'> => ({
  name: 'Test Employee',
  exportRecipient: 'Test Company',
  exportLogo: '',
  defaultBreakMinutes: 45,
  defaultStartTime: '06:30',
  sortOrder: 0,
  isActive: true,
  createdAt: new Date(),
  ...overrides,
})
