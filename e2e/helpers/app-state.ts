import type { Page } from '@playwright/test'

type SeedEmployee = {
  id: number
  name: string
  exportRecipient: string
  defaultBreakMinutes: number
  defaultStartTime: string
  sortOrder: number
  isActive: boolean
  createdAt: Date | string
}

type SeedClient = {
  id: number
  name: string
  defaultLocation: string
  lastUsedAt: Date | string | null
}

type SeedLocation = {
  id: number
  name: string
}

type SeedTimeEntry = {
  id: number
  employeeId: number
  date: string
  sortOrder: number
  clientId: number
  clientName: string
  location: string
  startTime: string
  endTime: string
  breakMinutes: number
  travelCreditMinutes: number
  isDriver: 'Ja' | 'Nee'
  notes: string
}

type SeedWeekExport = {
  id: number
  employeeId: number
  weekStart: string
  weekEnd: string
  exportedAt: Date | string
  format: 'pdf'
}

type SeedAppStateInput = {
  path?: string
  employees?: SeedEmployee[]
  clients?: SeedClient[]
  locations?: SeedLocation[]
  timeEntries?: SeedTimeEntry[]
  weekExports?: SeedWeekExport[]
  localStorage?: Record<string, string>
}

export const ACTIVE_PROFILE_STORAGE_KEY = 'timesheet.activeEmployeeId'

export async function seedAppState(page: Page, input: SeedAppStateInput) {
  const {
    path = '/',
    employees = [],
    clients = [],
    locations = [],
    timeEntries = [],
    weekExports = [],
    localStorage = {},
  } = input

  await page.goto('/')
  await page.evaluate(
    async ({ employees, clients, locations, timeEntries, weekExports, localStorage }) => {
      const storeNames = ['employees', 'clients', 'locations', 'timeEntries', 'weekExports'] as const

      const openDatabase = () =>
        new Promise<IDBDatabase>((resolve, reject) => {
          const request = window.indexedDB.open('timesheet')

          request.onupgradeneeded = () => {
            const db = request.result

            if (!db.objectStoreNames.contains('employees')) {
              const employeesStore = db.createObjectStore('employees', { keyPath: 'id', autoIncrement: true })
              employeesStore.createIndex('name', 'name')
              employeesStore.createIndex('exportRecipient', 'exportRecipient')
              employeesStore.createIndex('sortOrder', 'sortOrder')
              employeesStore.createIndex('isActive', 'isActive')
              employeesStore.createIndex('[isActive+sortOrder]', ['isActive', 'sortOrder'])
              employeesStore.createIndex('createdAt', 'createdAt')
            }

            if (!db.objectStoreNames.contains('clients')) {
              const clientsStore = db.createObjectStore('clients', { keyPath: 'id', autoIncrement: true })
              clientsStore.createIndex('name', 'name')
              clientsStore.createIndex('lastUsedAt', 'lastUsedAt')
            }

            if (!db.objectStoreNames.contains('locations')) {
              const locationsStore = db.createObjectStore('locations', { keyPath: 'id', autoIncrement: true })
              locationsStore.createIndex('name', 'name')
            }

            if (!db.objectStoreNames.contains('timeEntries')) {
              const timeEntriesStore = db.createObjectStore('timeEntries', { keyPath: 'id', autoIncrement: true })
              timeEntriesStore.createIndex('employeeId', 'employeeId')
              timeEntriesStore.createIndex('date', 'date')
              timeEntriesStore.createIndex('[employeeId+date]', ['employeeId', 'date'])
              timeEntriesStore.createIndex('sortOrder', 'sortOrder')
              timeEntriesStore.createIndex('clientId', 'clientId')
              timeEntriesStore.createIndex('clientName', 'clientName')
            }

            if (!db.objectStoreNames.contains('weekExports')) {
              const weekExportsStore = db.createObjectStore('weekExports', { keyPath: 'id', autoIncrement: true })
              weekExportsStore.createIndex('employeeId', 'employeeId')
              weekExportsStore.createIndex('weekStart', 'weekStart')
              weekExportsStore.createIndex('weekEnd', 'weekEnd')
              weekExportsStore.createIndex('exportedAt', 'exportedAt')
              weekExportsStore.createIndex('format', 'format')
              weekExportsStore.createIndex('[employeeId+weekStart+weekEnd]', ['employeeId', 'weekStart', 'weekEnd'])
            }
          }

          request.onsuccess = () => resolve(request.result)
          request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'))
        })

      const toDate = (value: Date | string | null) => {
        if (!value) {
          return value
        }

        return new Date(value)
      }

      window.localStorage.clear()
      for (const [key, value] of Object.entries(localStorage)) {
        window.localStorage.setItem(key, value)
      }

      const db = await openDatabase()

      await new Promise<void>((resolve, reject) => {
        const transaction = db.transaction(storeNames, 'readwrite')

        transaction.oncomplete = () => {
          db.close()
          resolve()
        }
        transaction.onerror = () => reject(transaction.error ?? new Error('Failed to seed IndexedDB'))
        transaction.onabort = () => reject(transaction.error ?? new Error('Seeding IndexedDB aborted'))

        for (const storeName of storeNames) {
          transaction.objectStore(storeName).clear()
        }

        employees.forEach((item) => transaction.objectStore('employees').put({ ...item, createdAt: toDate(item.createdAt) }))
        clients.forEach((item) => transaction.objectStore('clients').put({ ...item, lastUsedAt: toDate(item.lastUsedAt) }))
        locations.forEach((item) => transaction.objectStore('locations').put(item))
        timeEntries.forEach((item) => transaction.objectStore('timeEntries').put(item))
        weekExports.forEach((item) => transaction.objectStore('weekExports').put({ ...item, exportedAt: toDate(item.exportedAt) }))
      })
    },
    {
      employees,
      clients,
      locations,
      timeEntries,
      weekExports,
      localStorage,
    },
  )

  await page.goto(path)
}

export async function completeFirstRun(page: Page) {
  await page.goto('/')
  await page.getByLabel('Naam').fill('Milan')
  await page.getByLabel('Export naar').selectOption('CH Construct')
  await page.getByRole('button', { name: 'Start' }).click()
  await page.getByRole('button', { name: 'Milan · CH Construct' }).click()
}
