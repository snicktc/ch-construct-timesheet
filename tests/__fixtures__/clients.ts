import type { Client } from '../../src/db/database'

export const mockClients: Omit<Client, 'id'>[] = [
  {
    name: 'Project Amsterdam',
    defaultLocation: 'Amsterdam Centrum',
    lastUsedAt: new Date('2026-04-14T00:00:00Z'),
  },
  {
    name: 'Project Rotterdam',
    defaultLocation: 'Rotterdam Haven',
    lastUsedAt: new Date('2026-04-10T00:00:00Z'),
  },
  {
    name: 'Project Utrecht',
    defaultLocation: 'Utrecht CS',
    lastUsedAt: new Date('2026-04-01T00:00:00Z'),
  },
  {
    name: 'Nieuw Project',
    defaultLocation: 'Den Haag',
    lastUsedAt: null,
  },
]

export const createMockClient = (overrides: Partial<Omit<Client, 'id'>> = {}): Omit<Client, 'id'> => ({
  name: 'Test Client',
  defaultLocation: 'Test Location',
  lastUsedAt: null,
  ...overrides,
})
