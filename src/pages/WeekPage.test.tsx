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

  it('marks a week as leave and shows the leave note', async () => {
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

    const [markButton] = await screen.findAllByRole('button', { name: 'Markeer als verlof' })
    await user.click(markButton)

    await waitFor(() => {
      expect(screen.getByText(/Verlofweek · wordt overgeslagen/i)).toBeVisible()
    })

    // A leave record is persisted for the first week (Monday 2026-04-13).
    const stored = await db.leaveWeeks.where('employeeId').equals(activeEmployeeId).toArray()
    expect(stored.map((row) => row.weekStart)).toContain('2026-04-13')
  })

  it('excludes leave-week entries from the fortnight totals', async () => {
    await db.timeEntries.add(
      createTimeEntryRecord({
        employeeId: activeEmployeeId,
        date: '2026-04-14', // week one
        sortOrder: 0,
        clientId: 1,
        clientName: 'CH Construct',
        location: 'Gent',
        startTime: '06:30',
        endTime: '15:30',
      }),
    )
    // Mark week one as leave up front.
    await db.leaveWeeks.add({ employeeId: activeEmployeeId, weekStart: '2026-04-13', createdAt: new Date() })

    render(
      <WeekPage
        activeEmployee={activeEmployee}
        activeEmployeeId={activeEmployeeId}
        activeProfiles={[activeEmployee]}
        onSelectEmployee={vi.fn()}
        onOpenDay={vi.fn()}
      />,
    )

    // Leave note is visible and the client entry is not counted in the summary.
    await waitFor(() => {
      expect(screen.getByText(/Verlofweek · wordt overgeslagen/i)).toBeVisible()
    })
    expect(screen.getByText(/Nog geen registraties in deze 2 weken\./i)).toBeVisible()
  })

  it('skips a fully-leave fortnight when navigating forward', async () => {
    // Mark the entire NEXT fortnight (2026-04-27 .. 2026-05-10) as leave.
    await db.leaveWeeks.bulkAdd([
      { employeeId: activeEmployeeId, weekStart: '2026-04-27', createdAt: new Date() },
      { employeeId: activeEmployeeId, weekStart: '2026-05-04', createdAt: new Date() },
    ])

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

    // Current period header: week 16-17.
    expect(await screen.findByRole('heading', { level: 1, name: /Week 16-17/i })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Volgende 2 weken' }))

    // The next block (week 18-19) is fully on leave, so it is skipped and
    // we land on week 20-21 (2026-05-11 .. 2026-05-24).
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Week 20-21/i })).toBeVisible()
    })
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
