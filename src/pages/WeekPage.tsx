import { liveQuery } from 'dexie'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { ProfileSwitcher } from '../components/ProfileSwitcher'
import { Toast } from '../components/Toast'
import { createWeekExportRecord, db, type Employee, type TimeEntry } from '../db/database'
import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe'
import { useLeaveWeeks } from '../hooks/useLeaveWeeks'
import { calculateDayTotalMinutes, calculateEntryMinutes, formatMinutesAsHours } from '../utils/timeCalc'
import {
  addDays,
  formatDateKey,
  formatLongDate,
  formatShortDate,
  getFortnightDates,
  getFortnightStart,
  getIsoWeekNumber,
  getWeekStartKey,
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

// A generated PDF together with the exact inputs it was built from. The
// cached file is only reused while every input is still the same reference;
// any change to entries, leave weeks, employee or period invalidates it.
type PreparedPdf = {
  file: File
  employee: Employee
  entries: TimeEntry[]
  leaveWeekStarts: ReadonlySet<string>
  periodKey: string
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
  const [preparedPdf, setPreparedPdf] = useState<PreparedPdf | null>(null)

  const { leaveWeekStarts, isLeaveWeek, toggleLeaveWeek } = useLeaveWeeks(activeEmployeeId)

  // Advance the anchor in 2-week steps, skipping fortnight blocks whose
  // two calendar weeks are both marked as leave. A safety cap prevents an
  // infinite loop when many consecutive weeks are on leave.
  const advancePeriod = useCallback(
    (direction: 1 | -1) => {
      setAnchorDate((current) => {
        const maxHops = 27 // ~1 year of fortnights
        let candidate = addDays(current, direction * 14)

        for (let hop = 0; hop < maxHops; hop += 1) {
          const periodStart = getFortnightStart(candidate)
          const weekOneStart = formatDateKey(periodStart)
          const weekTwoStart = getWeekStartKey(addDays(periodStart, 7))
          const bothOnLeave = leaveWeekStarts.has(weekOneStart) && leaveWeekStarts.has(weekTwoStart)

          if (!bothOnLeave) {
            return candidate
          }

          candidate = addDays(candidate, direction * 14)
        }

        return candidate
      })
    },
    [leaveWeekStarts],
  )

  const handleSwipeLeft = useCallback(() => {
    advancePeriod(1)
  }, [advancePeriod])

  const handleSwipeRight = useCallback(() => {
    advancePeriod(-1)
  }, [advancePeriod])

  const swipeBindings = useHorizontalSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
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

  const weekOneDates = fortnightDates.slice(0, 7)
  const weekTwoDates = fortnightDates.slice(7, 14)
  const weekOneNumber = getIsoWeekNumber(weekOneDates[0])
  const weekTwoNumber = getIsoWeekNumber(weekTwoDates[0])

  const isWeekOneLeave = isLeaveWeek(weekOneDates[0])
  const isWeekTwoLeave = isLeaveWeek(weekTwoDates[0])
  const weekOneStartKey = getWeekStartKey(weekOneDates[0])
  const weekTwoStartKey = getWeekStartKey(weekTwoDates[0])

  // Entries that count towards summaries, totals and export exclude any
  // week that is marked as leave.
  const reportableEntries = useMemo(() => {
    const leaveWeekStartsForFortnight = new Set<string>()
    if (leaveWeekStarts.has(weekOneStartKey)) leaveWeekStartsForFortnight.add(weekOneStartKey)
    if (leaveWeekStarts.has(weekTwoStartKey)) leaveWeekStartsForFortnight.add(weekTwoStartKey)

    if (leaveWeekStartsForFortnight.size === 0) {
      return entries
    }

    return entries.filter((entry) => !leaveWeekStartsForFortnight.has(getWeekStartKey(parseDateKey(entry.date))))
  }, [entries, leaveWeekStarts, weekOneStartKey, weekTwoStartKey])

  const clientSummary = useMemo(() => {
    const summary = new Map<string, ClientSummary>()

    for (const entry of reportableEntries) {
      const current =
        summary.get(entry.clientName) ??
        ({ clientName: entry.clientName, totalMinutes: 0, uniqueDates: new Set<string>() } satisfies ClientSummary)

      current.totalMinutes += calculateEntryMinutes(entry)
      current.uniqueDates.add(entry.date)
      summary.set(entry.clientName, current)
    }

    return [...summary.values()].sort((left, right) => right.totalMinutes - left.totalMinutes)
  }, [reportableEntries])

  const totalUniqueDays = useMemo(() => new Set(reportableEntries.map((entry) => entry.date)).size, [reportableEntries])
  const totalMinutes = useMemo(
    () => reportableEntries.reduce((total, entry) => total + calculateEntryMinutes(entry), 0),
    [reportableEntries],
  )

  // Weekday completeness ignores leave weeks entirely.
  const weekdayDateKeys = fortnightDates
    .filter((date) => date.getDay() >= 1 && date.getDay() <= 5)
    .filter((date) => !isLeaveWeek(date))
    .map(formatDateKey)
  const requiredWeekdayCount = weekdayDateKeys.length
  const completedWeekdayCount = useMemo(
    () => weekdayDateKeys.filter((dateKey) => entriesByDate.has(dateKey)).length,
    [entriesByDate, weekdayDateKeys],
  )
  const lastWorkFridayKey = isWeekTwoLeave
    ? isWeekOneLeave
      ? null
      : formatDateKey(weekOneDates[4])
    : formatDateKey(weekTwoDates[4])
  const hasLastWorkFridayEntry = lastWorkFridayKey ? entriesByDate.has(lastWorkFridayKey) : false
  const isFortnightComplete =
    requiredWeekdayCount > 0 && completedWeekdayCount === requiredWeekdayCount && hasLastWorkFridayEntry
  const periodKey = `${fortnightStartKey}_${fortnightEndKey}`

  const isPreparedPdfCurrent =
    preparedPdf !== null &&
    preparedPdf.employee === activeEmployee &&
    preparedPdf.entries === entries &&
    preparedPdf.leaveWeekStarts === leaveWeekStarts &&
    preparedPdf.periodKey === periodKey

  const buildPreparedPdf = useCallback(async (): Promise<PreparedPdf> => {
    const { generateTimesheetPdf } = await import('../utils/pdfExport')
    const result = await generateTimesheetPdf({
      employee: activeEmployee,
      fortnightStart: fortnightDates[0],
      entries,
      leaveWeekStarts,
    })

    return {
      file: result.pdfFile,
      employee: activeEmployee,
      entries,
      leaveWeekStarts,
      periodKey,
    }
  }, [activeEmployee, entries, fortnightDates, leaveWeekStarts, periodKey])

  // Pre-generate the PDF as soon as the fortnight is complete so that sharing
  // is instant. Re-runs whenever any input changes so the cache never goes stale.
  useEffect(() => {
    if (!isFortnightComplete || isPreparedPdfCurrent) {
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const prepared = await buildPreparedPdf()

        if (!cancelled) {
          setPreparedPdf(prepared)
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
  }, [buildPreparedPdf, isFortnightComplete, isPreparedPdfCurrent])

  useEffect(() => {
    if (!exportError && !exportSuccess) {
      return
    }

    const duration = exportError ? 6000 : 4000

    const timeoutId = window.setTimeout(() => {
      setExportError('')
      setExportSuccess('')
    }, duration)

    return () => window.clearTimeout(timeoutId)
  }, [exportError, exportSuccess])

  const handleOpenDay = useCallback(
    (dateKey: string) => {
      onOpenDay(parseDateKey(dateKey))
    },
    [onOpenDay],
  )

  const renderWeekRows = useCallback(
    (dates: Date[], isLeave: boolean) => {
      const weekMinutes = dates.reduce((total, date) => {
        const dateEntries = entriesByDate.get(formatDateKey(date)) ?? []
        return total + calculateDayTotalMinutes(dateEntries)
      }, 0)
      const weekNumber = getIsoWeekNumber(dates[0])

      const result = (
        <section className={`panel${isLeave ? ' is-leave-week' : ''}`}>
          <div className="week-panel-header">
            <h2>Week {weekNumber}</h2>
            <button
              type="button"
              className={isLeave ? 'primary-button leave-toggle' : 'secondary-button leave-toggle'}
              aria-pressed={isLeave}
              onClick={() => void toggleLeaveWeek(dates[0])}
            >
              {isLeave ? 'Verlof — herstel week' : 'Markeer als verlof'}
            </button>
          </div>

          {isLeave ? (
            <p className="muted-text leave-week-note">
              Verlofweek · wordt overgeslagen bij navigeren en niet meegenomen in de PDF.
            </p>
          ) : (
            <>
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
                      onClick={() => handleOpenDay(dateKey)}
                    >
                    <div className="week-day-top">
                      <strong>{formatShortDate(date)}</strong>
                      <strong>{dateEntries.length > 0 ? formatMinutesAsHours(dayTotal) : '—'}</strong>
                    </div>

                    {dateEntries.length === 0 ? (
                      <p className="muted-text">{isWeekend(date) ? 'Weekend' : 'Nog niet geregistreerd · tik om toe te voegen'}</p>
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
                        <p className="muted-text">Tik om te bekijken of uren toe te voegen</p>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="week-subtotal-row">
              <span>Week {weekNumber} subtotaal</span>
              <strong>{formatMinutesAsHours(weekMinutes)}</strong>
            </div>
            </>
          )}
        </section>
      )
      return result
    },
    [entriesByDate, handleOpenDay, toggleLeaveWeek],
  )

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
        leaveWeekStarts,
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

      setPreparedPdf({
        file: result.pdfFile,
        employee: activeEmployee,
        entries,
        leaveWeekStarts,
        periodKey,
      })
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

      let file: File

      if (isPreparedPdfCurrent && preparedPdf) {
        file = preparedPdf.file
      } else {
        const prepared = await buildPreparedPdf()
        setPreparedPdf(prepared)
        file = prepared.file
      }

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
            <button type="button" className="secondary-button" aria-label="Vorige 2 weken" onClick={() => advancePeriod(-1)}>
              ◀
            </button>
            <button type="button" className="secondary-button" aria-label="Volgende 2 weken" onClick={() => advancePeriod(1)}>
              ▶
            </button>
          </div>
        </div>
      </header>

      {renderWeekRows(weekOneDates, isWeekOneLeave)}
      {renderWeekRows(weekTwoDates, isWeekTwoLeave)}

      {exportSuccess ? <Toast message={exportSuccess} tone="success" /> : null}
      {exportError ? <Toast message={exportError} tone="error" /> : null}

      {isFortnightComplete ? (
        <section className={`panel export-banner${highlightExportPrompt ? ' is-highlighted' : ''}`}>
          <strong>Werkweek compleet! Verstuur naar {activeEmployee.exportRecipient}?</strong>
          <p className="muted-text">
            Alle {requiredWeekdayCount} werkdagen zijn ingevuld. Je overzicht voor week{' '}
            {isWeekOneLeave || isWeekTwoLeave
              ? isWeekOneLeave
                ? weekTwoNumber
                : weekOneNumber
              : `${weekOneNumber}-${weekTwoNumber}`}{' '}
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
            <p className="muted-text">
              {isWeekOneLeave && isWeekTwoLeave
                ? 'Beide weken staan op verlof.'
                : 'Nog geen registraties in deze 2 weken.'}
            </p>
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
