import type { TimeEntry } from '../../src/db/database'

export const mockTimeEntries: Omit<TimeEntry, 'id'>[] = [
  // Monday, April 14, 2026 - Employee 1
  {
    employeeId: 1,
    date: '2026-04-14',
    sortOrder: 0,
    clientId: 1,
    clientName: 'Project Amsterdam',
    location: 'Amsterdam Centrum',
    startTime: '06:30',
    endTime: '15:00',
    breakMinutes: 45,
    travelCreditMinutes: 0,
    isDriver: 'Ja',
    notes: '',
  },
  {
    employeeId: 1,
    date: '2026-04-14',
    sortOrder: 1,
    clientId: 2,
    clientName: 'Project Rotterdam',
    location: 'Rotterdam Haven',
    startTime: '15:30',
    endTime: '17:00',
    breakMinutes: 0,
    travelCreditMinutes: 30,
    isDriver: 'Nee',
    notes: 'Extra werk',
  },
  // Tuesday, April 15, 2026 - Employee 1
  {
    employeeId: 1,
    date: '2026-04-15',
    sortOrder: 0,
    clientId: 1,
    clientName: 'Project Amsterdam',
    location: 'Amsterdam Centrum',
    startTime: '06:30',
    endTime: '15:30',
    breakMinutes: 45,
    travelCreditMinutes: 0,
    isDriver: 'Ja',
    notes: '',
  },
  // Monday, April 14, 2026 - Employee 2
  {
    employeeId: 2,
    date: '2026-04-14',
    sortOrder: 0,
    clientId: 3,
    clientName: 'Project Utrecht',
    location: 'Utrecht CS',
    startTime: '07:00',
    endTime: '16:00',
    breakMinutes: 30,
    travelCreditMinutes: 0,
    isDriver: 'Ja',
    notes: 'Reguliere werkdag',
  },
  // Previous week - for "Same as Yesterday" testing
  {
    employeeId: 1,
    date: '2026-04-10',
    sortOrder: 0,
    clientId: 1,
    clientName: 'Project Amsterdam',
    location: 'Amsterdam Centrum',
    startTime: '06:30',
    endTime: '15:00',
    breakMinutes: 45,
    travelCreditMinutes: 0,
    isDriver: 'Ja',
    notes: 'Vorige week',
  },
]

export const createMockTimeEntry = (overrides: Partial<Omit<TimeEntry, 'id'>> = {}): Omit<TimeEntry, 'id'> => ({
  employeeId: 1,
  date: '2026-04-15',
  sortOrder: 0,
  clientId: 1,
  clientName: 'Test Client',
  location: 'Test Location',
  startTime: '08:00',
  endTime: '17:00',
  breakMinutes: 45,
  travelCreditMinutes: 0,
  isDriver: 'Ja',
  notes: '',
  ...overrides,
})

export const createFortnightMockEntries = (employeeId: number, startDate: string): Omit<TimeEntry, 'id'>[] => {
  const entries: Omit<TimeEntry, 'id'>[] = []
  const start = new Date(startDate)

  // Create entries for 10 weekdays (2 weeks, Monday-Friday)
  for (let i = 0; i < 14; i++) {
    const date = new Date(start)
    date.setDate(date.getDate() + i)
    const dayOfWeek = date.getDay()

    // Skip weekends
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      continue
    }

    const dateKey = date.toISOString().split('T')[0]
    
    entries.push({
      employeeId,
      date: dateKey,
      sortOrder: 0,
      clientId: 1,
      clientName: 'Project Amsterdam',
      location: 'Amsterdam Centrum',
      startTime: '06:30',
      endTime: '15:00',
      breakMinutes: 45,
      travelCreditMinutes: 0,
      isDriver: 'Ja',
      notes: '',
    })
  }

  return entries
}
