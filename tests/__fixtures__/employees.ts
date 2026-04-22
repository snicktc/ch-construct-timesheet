import type { Employee } from '../../src/db/database'

export const mockEmployees: Omit<Employee, 'id'>[] = [
  {
    name: 'Jan Janssen',
    exportRecipient: 'CH Construct',
    defaultBreakMinutes: 45,
    defaultStartTime: '06:30',
    sortOrder: 0,
    isActive: true,
    createdAt: new Date('2026-01-01T00:00:00Z'),
  },
  {
    name: 'Piet Pietersen',
    exportRecipient: 'VBW',
    defaultBreakMinutes: 30,
    defaultStartTime: '07:00',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date('2026-01-15T00:00:00Z'),
  },
  {
    name: 'Klaas de Vries',
    exportRecipient: 'CH Construct',
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
  defaultBreakMinutes: 45,
  defaultStartTime: '06:30',
  sortOrder: 0,
  isActive: true,
  createdAt: new Date(),
  ...overrides,
})
