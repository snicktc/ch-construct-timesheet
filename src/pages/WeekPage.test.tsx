import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createEmployeeRecord, createTimeEntryRecord, db, type Employee } from '../db/database'
import { setupTestDb, teardownTestDb } from '../../tests/helpers/dbHelpers'
import { generateTimesheetPdf } from '../utils/pdfExport'
import { formatDateKey } from '../utils/weekHelpers'
import { WeekPage } from './WeekPage'

vi.mock('../hooks/useHorizontalSwipe', () => ({
  useHorizontalSwipe: () => ({}),
}))

vi.mock('../utils/pdfExport', () => ({
  generateTimesheetPdf: vi.fn(),
}))

const mockedGeneratePdf = vi.mocked(generateTimesheetPdf)

const createPdfResult = (label = 'pdf') => ({
  pdfBlob: new Blob([label], { type: 'application/pdf' }),
  pdfFile: new File([label], `${label}.pdf`, { type: 'application/pdf' }),
  fileName: `${label}.pdf`,
  weekStart: '2026-04-06',
  weekEnd: '2026-04-19',
})

// Fortnight 2026-04-06 .. 2026-04-19 (ISO weeks 15-16); 2026-04-17 is its last Friday.
const COMPLETE_FORTNIGHT_DATES = [
  '2026-04-06',
  '2026-04-07',
  '2026-04-08',
  '2026-04-09',
  '2026-04-10',
  '2026-04-13',
  '2026-04-14',
  '2026-04-15',
  '2026-04-16',
  '2026-04-17',
]

describe('WeekPage', () => {
  let activeEmployee: Employee
  let activeEmployeeId: number

  beforeEach(async () => {
    await setupTestDb()
    mockedGeneratePdf.mockReset()
    mockedGeneratePdf.mockImplementation(async () => createPdfResult() as never)
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
    await db.timeEntries.bulkAdd(
      COMPLETE_FORTNIGHT_DATES.map((date, index) =>
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

  it('regenerates the shared PDF after an entry changes in a complete fortnight', async () => {
    const entryIds = (await Promise.all(
      COMPLETE_FORTNIGHT_DATES.map((date, index) =>
        db.timeEntries.add(
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
      ),
    )) as number[]

    const shareSpy = vi.spyOn(navigator, 'share').mockResolvedValue(undefined)
    vi.spyOn(navigator, 'canShare').mockReturnValue(true)
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

    // The complete fortnight triggers a background pre-generation.
    //
    // Note: exact generation counts are deliberately not asserted. Dexie
    // propagates commits through BroadcastChannel, which in Vitest also
    // reaches other worker threads, so writes from unrelated test files make
    // the liveQuery re-emit (same data, new array) and trigger harmless
    // regenerations. The property under test is that a shared file is never
    // stale, which does not depend on the number of generations.
    await screen.findByText(/Werkweek compleet!/i)
    await waitFor(() => expect(mockedGeneratePdf).toHaveBeenCalled())

    await user.click(screen.getByRole('button', { name: 'Deel PDF nu' }))
    await waitFor(() => expect(shareSpy).toHaveBeenCalledTimes(1))
    expect(((shareSpy.mock.calls[0][0] as ShareData).files ?? [])[0]?.name).toBe('pdf.pdf')

    // The user corrects an entry after the PDF was prepared.
    mockedGeneratePdf.mockImplementation(async () => createPdfResult('updated') as never)
    const generationsBeforeUpdate = mockedGeneratePdf.mock.calls.length
    await db.timeEntries.update(entryIds[4], { endTime: '16:30' })

    await waitFor(() => expect(screen.getByText('06:30-16:30')).toBeVisible())
    await waitFor(() => expect(mockedGeneratePdf.mock.calls.length).toBeGreaterThan(generationsBeforeUpdate))

    const lastCall = mockedGeneratePdf.mock.calls.at(-1)?.[0]
    const correctedEntry = lastCall?.entries.find((entry) => entry.id === entryIds[4])
    expect(correctedEntry?.endTime).toBe('16:30')

    // Sharing now sends the regenerated file, not the stale one.
    await user.click(screen.getByRole('button', { name: 'Deel PDF nu' }))
    await waitFor(() => expect(shareSpy).toHaveBeenCalledTimes(2))
    const sharedFiles = (shareSpy.mock.calls[1][0] as ShareData).files ?? []
    expect(sharedFiles[0]?.name).toBe('updated.pdf')
  })

  it('records a week export after a successful share, but not after a cancelled one', async () => {
    // navigator.share is a vi.fn() from tests/setup.ts; spyOn reuses it, so
    // clear calls made by earlier tests in this file.
    const shareSpy = vi.spyOn(navigator, 'share').mockResolvedValue(undefined)
    shareSpy.mockClear()
    vi.spyOn(navigator, 'canShare').mockReturnValue(true)
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
    await waitFor(() => expect(shareSpy).toHaveBeenCalledTimes(1))

    await waitFor(async () => {
      const exports = await db.weekExports.where('employeeId').equals(activeEmployeeId).toArray()
      expect(exports).toHaveLength(1)
      expect(exports[0]).toMatchObject({ weekStart: '2026-04-06', weekEnd: '2026-04-19', format: 'pdf' })
    })

    // A cancelled share sheet must not be counted as an export.
    const abortError = new Error('cancelled')
    abortError.name = 'AbortError'
    shareSpy.mockRejectedValueOnce(abortError)

    await user.click(screen.getByRole('button', { name: 'Deel via...' }))
    await waitFor(() => expect(shareSpy).toHaveBeenCalledTimes(2))

    // Give any (incorrect) write a chance to land before asserting.
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(await db.weekExports.where('employeeId').equals(activeEmployeeId).count()).toBe(1)
    expect(screen.queryByText(/mislukt|niet ondersteund/i)).not.toBeInTheDocument()
  })

  it('records a week export when downloading the PDF', async () => {
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:pdf')
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined)
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined)
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

    await user.click(screen.getByRole('button', { name: 'Exporteer naar PDF' }))

    expect(await screen.findByText('PDF geëxporteerd.')).toBeVisible()
    expect(await db.weekExports.where('employeeId').equals(activeEmployeeId).count()).toBe(1)
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

    // A leave record is persisted for the first week (Monday 2026-04-06).
    const stored = await db.leaveWeeks.where('employeeId').equals(activeEmployeeId).toArray()
    expect(stored.map((row) => row.weekStart)).toContain('2026-04-06')
  })

  it('excludes leave-week entries from the fortnight totals', async () => {
    await db.timeEntries.add(
      createTimeEntryRecord({
        employeeId: activeEmployeeId,
        date: '2026-04-14', // week two
        sortOrder: 0,
        clientId: 1,
        clientName: 'CH Construct',
        location: 'Gent',
        startTime: '06:30',
        endTime: '15:30',
      }),
    )
    // Mark week two as leave up front.
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
    // Mark the entire NEXT fortnight (2026-04-20 .. 2026-05-03, weeks 17-18) as leave.
    await db.leaveWeeks.bulkAdd([
      { employeeId: activeEmployeeId, weekStart: '2026-04-20', createdAt: new Date() },
      { employeeId: activeEmployeeId, weekStart: '2026-04-27', createdAt: new Date() },
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

    // Current period header: week 15-16.
    expect(await screen.findByRole('heading', { level: 1, name: /Week 15-16/i })).toBeVisible()

    await user.click(screen.getByRole('button', { name: 'Volgende 2 weken' }))

    // The next block (week 17-18) is fully on leave, so it is skipped and
    // we land on week 19-20 (2026-05-04 .. 2026-05-17).
    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: /Week 19-20/i })).toBeVisible()
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
