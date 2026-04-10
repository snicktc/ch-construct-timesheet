import { liveQuery } from 'dexie'
import { useEffect, useMemo, useState } from 'react'

import { ProfileSwitcher } from '../components/ProfileSwitcher'
import { Toast } from '../components/Toast'
import { createWeekExportRecord, db, type Employee, type TimeEntry } from '../db/database'
import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe'
import { calculateDayTotalMinutes, calculateEntryMinutes, formatMinutesAsHours } from '../utils/timeCalc'
import {
  addDays,
  formatDateKey,
  formatLongDate,
  formatShortDate,
  getFortnightDates,
  getIsoWeekNumber,
  isWeekend,
  parseDateKey,
} from '../utils/weekHelpers'

type WeekPageProps = {
  activeEmployee: Employee
  activeEmployeeId: number
  activeProfiles: Employee[]
  onSelectEmployee: (employeeId: number) => void
  onOpenDay: (date: Date) => void
  highlightExportPrompt?: boolean
}

type ClientSummary = {
  clientName: string
  totalMinutes: number
  uniqueDates: Set<string>
}

const sortEntries = (entries: TimeEntry[]) => [...entries].sort((left, right) => left.sortOrder - right.sortOrder)

export function WeekPage({
  activeEmployee,
  activeEmployeeId,
  activeProfiles,
  onSelectEmployee,
  onOpenDay,
  highlightExportPrompt = false,
}: WeekPageProps) {
  const [anchorDate, setAnchorDate] = useState(() => new Date())
  const [entries, setEntries] = useState<TimeEntry[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState('')
  const [exportSuccess, setExportSuccess] = useState('')
  const [latestExportFile, setLatestExportFile] = useState<File | null>(null)
  const [preparedSharePeriodKey, setPreparedSharePeriodKey] = useState('')
  const swipeBindings = useHorizontalSwipe({
    onSwipeLeft: () => setAnchorDate((current) => addDays(current, 14)),
    onSwipeRight: () => setAnchorDate((current) => addDays(current, -14)),
  })

  const fortnightDates = useMemo(() => getFortnightDates(anchorDate), [anchorDate])
  const fortnightStartKey = formatDateKey(fortnightDates[0])
  const fortnightEndKey = formatDateKey(fortnightDates[13])

  useEffect(() => {
    const subscription = liveQuery(async () => {
      const rows = await db.timeEntries
        .where('[employeeId+date]')
        .between([activeEmployeeId, fortnightStartKey], [activeEmployeeId, fortnightEndKey], true, true)
        .toArray()

      return rows
    }).subscribe({
      next: (snapshot) => setEntries(snapshot),
      error: (error) => {
        console.error('Failed to load fortnight entries', error)
        setEntries([])
      },
    })

    return () => subscription.unsubscribe()
  }, [activeEmployeeId, fortnightEndKey, fortnightStartKey])

  const entriesByDate = useMemo(() => {
    const grouped = new Map<string, TimeEntry[]>()

    for (const entry of entries) {
      const current = grouped.get(entry.date) ?? []
      current.push(entry)
      grouped.set(entry.date, current)
    }

    for (const [date, dateEntries] of grouped) {
      grouped.set(date, sortEntries(dateEntries))
    }

    return grouped
  }, [entries])

  const clientSummary = useMemo(() => {
    const summary = new Map<string, ClientSummary>()

    for (const entry of entries) {
      const current =
        summary.get(entry.clientName) ??
        ({ clientName: entry.clientName, totalMinutes: 0, uniqueDates: new Set<string>() } satisfies ClientSummary)

      current.totalMinutes += calculateEntryMinutes(entry)
      current.uniqueDates.add(entry.date)
      summary.set(entry.clientName, current)
    }

    return [...summary.values()].sort((left, right) => right.totalMinutes - left.totalMinutes)
  }, [entries])

  const totalUniqueDays = useMemo(() => new Set(entries.map((entry) => entry.date)).size, [entries])
  const totalMinutes = useMemo(() => entries.reduce((total, entry) => total + calculateEntryMinutes(entry), 0), [entries])

  const weekOneDates = fortnightDates.slice(0, 7)
  const weekTwoDates = fortnightDates.slice(7, 14)
  const weekOneNumber = getIsoWeekNumber(weekOneDates[0])
  const weekTwoNumber = getIsoWeekNumber(weekTwoDates[0])
  const weekdayDateKeys = fortnightDates
    .filter((date) => date.getDay() >= 1 && date.getDay() <= 5)
    .map(formatDateKey)
  const completedWeekdayCount = useMemo(
    () => weekdayDateKeys.filter((dateKey) => entriesByDate.has(dateKey)).length,
    [entriesByDate, weekdayDateKeys],
  )
  const secondFridayKey = formatDateKey(weekTwoDates[4])
  const hasSecondFridayEntry = entriesByDate.has(secondFridayKey)
  const isFortnightComplete = completedWeekdayCount === 10 && hasSecondFridayEntry
  const periodKey = `${fortnightStartKey}_${fortnightEndKey}`

  useEffect(() => {
    setLatestExportFile(null)
    setPreparedSharePeriodKey('')
  }, [activeEmployeeId, periodKey])

  useEffect(() => {
    if (!isFortnightComplete || preparedSharePeriodKey === periodKey) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const { generateTimesheetPdf } = await import('../utils/pdfExport')
        const result = await generateTimesheetPdf({
          employee: activeEmployee,
          fortnightStart: fortnightDates[0],
          entries,
        })

        if (!cancelled) {
          setLatestExportFile(result.pdfFile)
          setPreparedSharePeriodKey(periodKey)
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to pre-generate fortnight PDF', error)
        }
      }
    })()

    return () => {
      cancelled = true
    }
  }, [
    activeEmployee,
    entries,
    fortnightDates,
    isFortnightComplete,
    latestExportFile,
    periodKey,
    preparedSharePeriodKey,
  ])

  useEffect(() => {
    if (!exportError && !exportSuccess) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setExportError('')
      setExportSuccess('')
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [exportError, exportSuccess])

  const renderWeekRows = (dates: Date[]) => {
    const weekMinutes = dates.reduce((total, date) => {
      const dateEntries = entriesByDate.get(formatDateKey(date)) ?? []
      return total + calculateDayTotalMinutes(dateEntries)
    }, 0)

    return (
      <section className="panel">
        <h2>Week {getIsoWeekNumber(dates[0])}</h2>
        <div className="week-day-list">
          {dates.map((date) => {
            const dateKey = formatDateKey(date)
            const dateEntries = entriesByDate.get(dateKey) ?? []
            const dayTotal = calculateDayTotalMinutes(dateEntries)

            return (
              <button
                key={dateKey}
                type="button"
                className={`week-day-card${dateEntries.length === 0 ? ' is-empty' : ''}${isWeekend(date) ? ' is-weekend' : ''}`}
                onClick={() => onOpenDay(parseDateKey(dateKey))}
              >
                <div className="week-day-top">
                  <strong>{formatShortDate(date)}</strong>
                  <strong>{dateEntries.length > 0 ? formatMinutesAsHours(dayTotal) : '—'}</strong>
                </div>

                {dateEntries.length === 0 ? (
                  <p className="muted-text">{isWeekend(date) ? 'Weekend' : 'Nog niet geregistreerd'}</p>
                ) : (
                  <div className="week-day-entries">
                    {dateEntries.map((entry, index) => (
                      <div key={entry.id ?? `${dateKey}-${index}`} className="week-entry-row">
                        <span>
                          {entry.clientName} - {entry.location}
                        </span>
                        <span>
                          {entry.startTime}-{entry.endTime}
                        </span>
                        {entry.notes ? <em className="week-entry-notes">{entry.notes}</em> : null}
                      </div>
                    ))}
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <div className="week-subtotal-row">
          <span>Week {getIsoWeekNumber(dates[0])} subtotaal</span>
          <strong>{formatMinutesAsHours(weekMinutes)}</strong>
        </div>
      </section>
    )
  }

  const handleExportPdf = async () => {
    try {
      setIsExporting(true)
      setExportError('')
      setExportSuccess('')
      const { generateTimesheetPdf } = await import('../utils/pdfExport')

      const result = await generateTimesheetPdf({
        employee: activeEmployee,
        fortnightStart: fortnightDates[0],
        entries,
      })

      const downloadUrl = URL.createObjectURL(result.pdfBlob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = result.fileName
      link.click()
      URL.revokeObjectURL(downloadUrl)

      await db.weekExports.add(
        createWeekExportRecord({
          employeeId: activeEmployeeId,
          weekStart: result.weekStart,
          weekEnd: result.weekEnd,
        }),
      )

      setLatestExportFile(result.pdfFile)
      setExportSuccess('PDF geëxporteerd.')
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'PDF export mislukt.')
    } finally {
      setIsExporting(false)
    }
  }

  const handleSharePdf = async () => {
    try {
      setExportError('')
      const { generateTimesheetPdf } = await import('../utils/pdfExport')

      const file = latestExportFile
        && preparedSharePeriodKey === periodKey
        ? latestExportFile
        : (
            await generateTimesheetPdf({
              employee: activeEmployee,
              fortnightStart: fortnightDates[0],
              entries,
            })
          ).pdfFile

      if (!navigator.share || !navigator.canShare?.({ files: [file] })) {
        throw new Error('Delen wordt niet ondersteund op dit toestel.')
      }

      await navigator.share({
        title: 'Werkurenregistratie',
        text: `Werkuren van ${activeEmployee.name}`,
        files: [file],
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return
      }

      setExportError(error instanceof Error ? error.message : 'Delen mislukt.')
    }
  }

  return (
    <section className="today-page" {...swipeBindings}>
      <header className="today-header">
        <ProfileSwitcher
          profiles={activeProfiles}
          activeEmployeeId={activeEmployeeId}
          onSelect={onSelectEmployee}
        />

        <div className="today-header-meta">
          <div>
            <h1>
              Week {weekOneNumber}-{weekTwoNumber}
            </h1>
            <p>
              {formatLongDate(fortnightDates[0])} - {formatLongDate(fortnightDates[13])} · {activeEmployee.name}
            </p>
          </div>

          <div className="date-nav" aria-label="Periode navigatie">
            <button type="button" className="secondary-button" onClick={() => setAnchorDate((current) => addDays(current, -14))}>
              ◀
            </button>
            <button type="button" className="secondary-button" onClick={() => setAnchorDate((current) => addDays(current, 14))}>
              ▶
            </button>
          </div>
        </div>
      </header>

      {renderWeekRows(weekOneDates)}
      {renderWeekRows(weekTwoDates)}

      {exportSuccess ? <Toast message={exportSuccess} tone="success" /> : null}
      {exportError ? <Toast message={exportError} tone="error" /> : null}

      {isFortnightComplete ? (
        <section className={`panel export-banner${highlightExportPrompt ? ' is-highlighted' : ''}`}>
          <strong>Werkweek compleet! Verstuur naar {activeEmployee.exportRecipient}?</strong>
          <p className="muted-text">
            Alle 10 werkdagen zijn ingevuld. Je overzicht voor week {weekOneNumber}-{weekTwoNumber}{' '}
            staat klaar.
          </p>
          <div className="button-row">
            <button type="button" className="primary-button" onClick={() => void handleSharePdf()}>
              Deel PDF nu
            </button>
            <button type="button" className="secondary-button" onClick={() => void handleExportPdf()}>
              Download PDF
            </button>
          </div>
        </section>
      ) : null}

      <section className="panel">
        <h2>Samenvatting</h2>
        <div className="summary-list">
          {clientSummary.length === 0 ? (
            <p className="muted-text">Nog geen registraties in deze 2 weken.</p>
          ) : (
            clientSummary.map((client) => (
              <div key={client.clientName} className="summary-row">
                <span>{client.clientName}</span>
                <span>{client.uniqueDates.size} dagen</span>
                <strong>{formatMinutesAsHours(client.totalMinutes)}</strong>
              </div>
            ))
          )}
        </div>

        <div className="week-subtotal-row total-row">
          <span>Totaal 2 weken</span>
          <span>{totalUniqueDays} dagen</span>
          <strong>{formatMinutesAsHours(totalMinutes)}</strong>
        </div>

        <div className="button-row">
          <button type="button" className="primary-button" onClick={() => void handleExportPdf()} disabled={isExporting}>
            {isExporting ? 'PDF maken...' : 'Exporteer naar PDF'}
          </button>
          <button type="button" className="secondary-button" onClick={() => void handleSharePdf()}>
            Deel via...
          </button>
        </div>
      </section>
    </section>
  )
}
