import { db } from '../../src/db/database'
import { mockEmployees } from '../__fixtures__/employees'
import { mockClients } from '../__fixtures__/clients'
import { mockTimeEntries } from '../__fixtures__/timeEntries'

/**
 * Setup fresh database for testing
 * Call this in beforeEach to ensure clean state
 */
export const setupTestDb = async () => {
  await db.delete()
  await db.open()
}

/**
 * Clear all tables in the database
 */
export const clearTestDb = async () => {
  await db.employees.clear()
  await db.clients.clear()
  await db.locations.clear()
  await db.timeEntries.clear()
  await db.weekExports.clear()
}

/**
 * Seed database with mock data
 * @param options - Which data to seed
 */
export const seedTestDb = async (options: {
  employees?: boolean
  clients?: boolean
  timeEntries?: boolean
} = {}) => {
  const { employees = true, clients = true, timeEntries = true } = options

  const employeeIds: number[] = []
  const clientIds: number[] = []

  if (employees) {
    for (const employee of mockEmployees) {
      const id = await db.employees.add(employee)
      employeeIds.push(id)
    }
  }

  if (clients) {
    for (const client of mockClients) {
      const id = await db.clients.add(client)
      clientIds.push(id)
    }
  }

  if (timeEntries && employees && clients) {
    for (const entry of mockTimeEntries) {
      await db.timeEntries.add(entry)
    }
  }

  return { employeeIds, clientIds }
}

/**
 * Close and clean up database
 * Call this in afterEach
 */
export const teardownTestDb = async () => {
  await db.delete()
  await db.close()
}

/**
 * Get count of records in a table
 */
export const getTableCount = async (table: 'employees' | 'clients' | 'timeEntries' | 'locations' | 'weekExports') => {
  return await db[table].count()
}

/**
 * Wait for database operation to complete
 * Useful for testing reactive queries
 */
export const waitForDbUpdate = (ms: number = 100) => {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
