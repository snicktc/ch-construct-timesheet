import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createEmployeeRecord, createTimeEntryRecord, db, type Employee } from '../db/database'
import { setupTestDb, teardownTestDb } from '../../tests/helpers/dbHelpers'
import { formatDateKey } from '../utils/weekHelpers'
import { WeekPage } from './WeekPage'

vi.mock('../hooks/useHorizontalSwipe', () => ({
  useHorizontalSwipe: () => ({}),
}))

vi.mock('../utils/pdfExport', () => ({
  generateTimesheetPdf: vi.fn().mockResolvedValue({
    pdfBlob: new Blob(['pdf'], { type: 'application/pdf' }),
    pdfFile: new File(['pdf'], 'timesheet.pdf', { type: 'application/pdf' }),
    fileName: 'timesheet.pdf',
    weekStart: '2026-04-13',
    weekEnd: '2026-04-26',
  }),
}))

describe('WeekPage', () => {
  let activeEmployee: Employee
  let activeEmployeeId: number

  beforeEach(async () => {
    await setupTestDb()
    vi.setSystemTime(new Date('2026-04-17T12:00:00.000Z'))
    activeEmployeeId = await db.employees.add(
      createEmployeeRecord({ name: 'Milan', exportRecipient: 'CH Construct' }),
    ) as number
    activeEmployee = (await db.employees.get(activeEmployeeId)) as Employee
  })

  afterEach(async () => {
    vi.restoreAllMocks()
    await teardownTestDb()
  })

  it('opens the selected day from the fortnight overview', async () => {
    await db.timeEntries.add(
      createTimeEntryRecord({
        employeeId: activeEmployeeId,
        date: '2026-04-14',
        sortOrder: 0,
        clientId: 1,
        clientName: 'CH Construct',
        location: 'Gent',
        startTime: '06:30',
        endTime: '15:30',
      }),
    )

    const onOpenDay = vi.fn()
    const user = userEvent.setup()

    render(
      <WeekPage
        activeEmployee={activeEmployee}
        activeEmployeeId={activeEmployeeId}
        activeProfiles={[activeEmployee]}
        onSelectEmployee={vi.fn()}
        onOpenDay={onOpenDay}
      />,
    )

    const dayLabel = await screen.findByText('di 14')
    const dayButton = dayLabel.closest('button')

    if (!dayButton) {
      throw new Error('Expected week day button for di 14')
    }

    await user.click(dayButton)

    expect(formatDateKey(onOpenDay.mock.calls[0][0] as Date)).toBe('2026-04-14')
  })

  it('shows the export banner when the fortnight is complete', async () => {
    const dates = [
      '2026-04-13',
      '2026-04-14',
      '2026-04-15',
      '2026-04-16',
      '2026-04-17',
      '2026-04-20',
      '2026-04-21',
      '2026-04-22',
      '2026-04-23',
      '2026-04-24',
    ]

    await db.timeEntries.bulkAdd(
      dates.map((date, index) =>
        createTimeEntryRecord({
          employeeId: activeEmployeeId,
          date,
          sortOrder: index,
          clientId: 1,
          clientName: 'CH Construct',
          location: 'Gent',
          startTime: '06:30',
          endTime: '15:30',
        }),
      ),
    )

    render(
      <WeekPage
        activeEmployee={activeEmployee}
        activeEmployeeId={activeEmployeeId}
        activeProfiles={[activeEmployee]}
        onSelectEmployee={vi.fn()}
        onOpenDay={vi.fn()}
        highlightExportPrompt
      />,
    )

    expect(await screen.findByText(/Werkweek compleet!/i)).toBeVisible()
    expect(screen.getByText(/Alle 10 werkdagen zijn ingevuld/i)).toBeVisible()
  })

  it('shows a share error when Web Share is unsupported', async () => {
    vi.spyOn(navigator, 'canShare').mockReturnValue(false)

    const user = userEvent.setup()

    render(
      <WeekPage
        activeEmployee={activeEmployee}
        activeEmployeeId={activeEmployeeId}
        activeProfiles={[activeEmployee]}
        onSelectEmployee={vi.fn()}
        onOpenDay={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Deel via...' }))

    await waitFor(() => {
      expect(screen.getByText('Delen wordt niet ondersteund op dit toestel.')).toBeVisible()
    })
  })
})
