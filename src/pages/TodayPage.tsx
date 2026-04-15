import { liveQuery } from 'dexie'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { EntryForm } from '../components/EntryForm'
import { EntryCard } from '../components/EntryCard'
import { ProfileSwitcher } from '../components/ProfileSwitcher'
import { RepeatCard } from '../components/RepeatCard'
import { Sheet } from '../components/Sheet'
import { Toast } from '../components/Toast'
import { WeekDots } from '../components/WeekDots'
import { db, type DriverStatus, type Employee, type TimeEntry } from '../db/database'
import { useHorizontalSwipe } from '../hooks/useHorizontalSwipe'
import { useClients } from '../hooks/useClients'
import { useTimeEntry } from '../hooks/useTimeEntry'
import { formatMinutesAsHours } from '../utils/timeCalc'
import {
  addDays,
  formatDateKey,
  formatLongDate,
  getDayLabel,
  getWeekdayDates,
  isSameDate,
} from '../utils/weekHelpers'

type TodayPageProps = {
  activeEmployee: Employee
  activeEmployeeId: number
  activeProfiles: Employee[]
  onSelectEmployee: (employeeId: number) => void
  initialDate?: Date
  onDateConsumed?: () => void
  highlightRepeatCard?: boolean
  openedFromWeek?: boolean
}

export function TodayPage({
  activeEmployee,
  activeEmployeeId,
  activeProfiles,
  onSelectEmployee,
  initialDate,
  onDateConsumed,
  highlightRepeatCard = false,
  openedFromWeek = false,
}: TodayPageProps) {
  const [selectedDate, setSelectedDate] = useState(() => initialDate ?? new Date())
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isRepeating, setIsRepeating] = useState(false)
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)
  const [focusClientTrigger, setFocusClientTrigger] = useState(0)
  const daySectionRef = useRef<HTMLElement | null>(null)

  const selectedDateKey = formatDateKey(selectedDate)
  const todayDateKey = formatDateKey(new Date())
  const weekdayDates = useMemo(() => getWeekdayDates(selectedDate), [selectedDate])
  const weekdayDateKeys = useMemo(() => weekdayDates.map(formatDateKey), [weekdayDates])

  const { clients, createClient } = useClients()
  const {
    entries,
    previousWorkdayEntries,
    loading,
    dayTotalMinutes,
    repeatPreviousWorkday,
    createEntry,
    updateEntry,
    deleteEntry,
  } = useTimeEntry(activeEmployeeId, selectedDateKey)

  const suggestedStartTime = entries.length > 0 ? entries[entries.length - 1].endTime : activeEmployee.defaultStartTime
  const defaultBreakMinutes = entries.length > 0 ? 0 : activeEmployee.defaultBreakMinutes
  const shouldShowInlineEmptyForm = !loading && entries.length === 0 && !editingEntry

  const handleSwipeLeft = useCallback(() => {
    console.time('[PERF] TodayPage: swipeLeft')
    setSelectedDate((current) => addDays(current, 1))
    console.timeEnd('[PERF] TodayPage: swipeLeft')
  }, [])

  const handleSwipeRight = useCallback(() => {
    console.time('[PERF] TodayPage: swipeRight')
    setSelectedDate((current) => addDays(current, -1))
    console.timeEnd('[PERF] TodayPage: swipeRight')
  }, [])

  const swipeBindings = useHorizontalSwipe({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
  })

  useEffect(() => {
    if (!initialDate) {
      return
    }

    setSelectedDate(initialDate)
  }, [initialDate, onDateConsumed])

  useEffect(() => {
    if (!openedFromWeek) {
      return
    }

    daySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    onDateConsumed?.()
  }, [openedFromWeek, onDateConsumed, selectedDateKey])

  useEffect(() => {
    setFeedbackMessage('')
    setErrorMessage('')
    setIsFormOpen(false)
    setEditingEntry(null)
  }, [activeEmployeeId, selectedDateKey])

  useEffect(() => {
    if (!feedbackMessage && !errorMessage) {
      return
    }

    const duration = errorMessage ? 6000 : 4000

    const timeoutId = window.setTimeout(() => {
      setFeedbackMessage('')
      setErrorMessage('')
    }, duration)

    return () => window.clearTimeout(timeoutId)
  }, [errorMessage, feedbackMessage])

  useEffect(() => {
    const startDate = weekdayDateKeys[0]
    const endDate = weekdayDateKeys[weekdayDateKeys.length - 1]

    const subscription = liveQuery(async () => {
      const weekEntries = await db.timeEntries
        .where('[employeeId+date]')
        .between([activeEmployeeId, startDate], [activeEmployeeId, endDate], true, true)
        .toArray()

      return new Set(weekEntries.map((entry) => entry.date))
    }).subscribe({
      next: (dates) => setCompletedDates(dates),
      error: (error) => {
        console.error('Failed to load week progress', error)
        setCompletedDates(new Set())
      },
    })

    return () => subscription.unsubscribe()
  }, [activeEmployeeId, weekdayDateKeys])

  const handleRepeat = useCallback(async () => {
    console.time('[PERF] TodayPage: repeatPreviousWorkday')
    try {
      setIsRepeating(true)
      setErrorMessage('')
      await repeatPreviousWorkday(selectedDateKey)
      setFeedbackMessage('Opgeslagen.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Kopieren mislukt.')
    } finally {
      setIsRepeating(false)
    }
    console.timeEnd('[PERF] TodayPage: repeatPreviousWorkday')
  }, [repeatPreviousWorkday, selectedDateKey])

  const handleCreateClient = useCallback(
    async (input: { name: string; defaultLocation: string }) => {
      const createdId = await createClient(input)

      if (!createdId) {
        throw new Error('Klant aanmaken mislukt.')
      }

      return createdId
    },
    [createClient],
  )

  const handleCreateEntry = useCallback(
    async (input: {
      employeeId: number
      date: string
      clientId: number
      location: string
      startTime: string
      endTime: string
      breakMinutes?: number
      travelCreditMinutes?: number
      isDriver?: DriverStatus
      notes?: string
    }) => {
      await createEntry({ ...input, date: selectedDateKey })
      setFeedbackMessage('Uren opgeslagen.')
      setIsFormOpen(false)
    },
    [createEntry, selectedDateKey],
  )

  const handleUpdateEntry = useCallback(
    async (input: {
      employeeId: number
      date: string
      clientId: number
      location: string
      startTime: string
      endTime: string
      breakMinutes?: number
      travelCreditMinutes?: number
      isDriver?: DriverStatus
      notes?: string
    }) => {
      if (!editingEntry?.id) {
        return
      }

      await updateEntry(editingEntry.id, input)
      setFeedbackMessage('Uren bijgewerkt.')
      setEditingEntry(null)
      setIsFormOpen(false)
    },
    [editingEntry, updateEntry],
  )

  const handleDeleteEntry = useCallback(async () => {
    if (!editingEntry?.id) {
      return
    }

    await deleteEntry(editingEntry.id)
    setFeedbackMessage('Uren verwijderd.')
    setEditingEntry(null)
    setIsFormOpen(false)
  }, [editingEntry, deleteEntry])

  const handleCancelForm = useCallback(() => {
    setEditingEntry(null)
  }, [])

  const handleCloseSheet = useCallback(() => {
    setIsFormOpen(false)
    setEditingEntry(null)
  }, [])

  const handleEditEntry = useCallback(
    (entry: TimeEntry) => {
      setEditingEntry(entry)
      setIsFormOpen(true)
    },
    [],
  )

  const handlePreviousDay = useCallback(() => {
    setSelectedDate((current) => addDays(current, -1))
  }, [])

  const handleNextDay = useCallback(() => {
    setSelectedDate((current) => addDays(current, 1))
  }, [])

  const handleAddEntry = useCallback(() => {
    setEditingEntry(null)

    if (shouldShowInlineEmptyForm) {
      daySectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      setFocusClientTrigger((current) => current + 1)
      return
    }

    setFocusClientTrigger((current) => current + 1)
    setIsFormOpen(true)
  }, [shouldShowInlineEmptyForm])

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
            <h1>{getDayLabel(selectedDate)}</h1>
            <p>
              {formatLongDate(selectedDate)} · {activeEmployee.exportRecipient}
            </p>
            {openedFromWeek ? <span className="context-chip">Gekozen vanuit weekoverzicht</span> : null}
          </div>

          <div className="date-nav" aria-label="Datum navigatie">
            <button type="button" className="secondary-button" aria-label="Vorige dag" onClick={handlePreviousDay}>
              ◀
            </button>
            <button type="button" className="secondary-button" aria-label="Volgende dag" onClick={handleNextDay}>
              ▶
            </button>
          </div>
        </div>

        <WeekDots dates={weekdayDateKeys} completedDates={completedDates} todayDate={todayDateKey} />
      </header>

      {feedbackMessage ? <Toast message={feedbackMessage} tone="success" /> : null}
      {errorMessage ? <Toast message={errorMessage} tone="error" /> : null}

      {loading ? <section className="panel muted-text">Registraties laden...</section> : null}

      {!loading && entries.length === 0 ? (
        <div className={highlightRepeatCard ? 'highlight-ring' : ''}>
          <RepeatCard entries={previousWorkdayEntries} onRepeat={handleRepeat} disabled={isRepeating} />
        </div>
      ) : null}

      {shouldShowInlineEmptyForm ? (
        <section className={`panel${openedFromWeek ? ' is-highlighted-panel' : ''}`} ref={daySectionRef}>
          {openedFromWeek ? <p className="context-note">Voeg hieronder meteen uren toe voor deze dag.</p> : null}
          <EntryForm
            employee={activeEmployee}
            clients={clients}
            dayEntries={entries}
            focusClientTrigger={focusClientTrigger}
            suggestedStartTime={suggestedStartTime}
            defaultBreakMinutes={defaultBreakMinutes}
            onSubmit={handleCreateEntry}
            onCreateClient={handleCreateClient}
            onCancel={handleCancelForm}
          />
        </section>
      ) : null}

      <Sheet
        open={isFormOpen && (!shouldShowInlineEmptyForm || Boolean(editingEntry))}
        onClose={handleCloseSheet}
        title={editingEntry ? 'Uren bewerken' : 'Uren toevoegen'}
      >
          <EntryForm
            employee={activeEmployee}
            clients={clients}
            dayEntries={entries}
            focusClientTrigger={focusClientTrigger}
            existingEntry={editingEntry ?? undefined}
            suggestedStartTime={suggestedStartTime}
            defaultBreakMinutes={defaultBreakMinutes}
          onSubmit={editingEntry ? handleUpdateEntry : handleCreateEntry}
          onDelete={editingEntry ? handleDeleteEntry : undefined}
          onCreateClient={handleCreateClient}
          onCancel={handleCloseSheet}
        />
      </Sheet>

      <section className={`panel${openedFromWeek && !shouldShowInlineEmptyForm ? ' is-highlighted-panel' : ''}`} ref={!shouldShowInlineEmptyForm ? daySectionRef : undefined}>
        <div className="section-heading">
          <h2>{isSameDate(selectedDate, new Date()) ? 'Registraties vandaag' : `Registraties ${getDayLabel(selectedDate).toLowerCase()}`}</h2>
          <span className="muted-text">{selectedDateKey}</span>
        </div>

        {!loading && entries.length === 0 ? (
          <p className="muted-text">
            {isSameDate(selectedDate, new Date())
              ? 'Nog geen uren vandaag. Gebruik de groene kaart of vul het formulier hierboven in.'
              : 'Nog geen uren voor deze dag.'}
          </p>
        ) : null}

        <div className="entry-list">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={() => handleEditEntry(entry)}
            />
          ))}
        </div>

        <button
          type="button"
          className="add-entry-button"
          onClick={handleAddEntry}
        >
          + Uren toevoegen voor deze dag
        </button>

        <div className="day-total-card">
          <span>Dagtotaal</span>
          <strong>{formatMinutesAsHours(dayTotalMinutes)}</strong>
        </div>
      </section>
    </section>
  )
}
