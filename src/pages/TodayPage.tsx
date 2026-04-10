import { liveQuery } from 'dexie'
import { useEffect, useMemo, useState } from 'react'

import { EntryForm } from '../components/EntryForm'
import { EntryCard } from '../components/EntryCard'
import { ProfileSwitcher } from '../components/ProfileSwitcher'
import { RepeatCard } from '../components/RepeatCard'
import { Sheet } from '../components/Sheet'
import { Toast } from '../components/Toast'
import { WeekDots } from '../components/WeekDots'
import { db, type Employee, type TimeEntry } from '../db/database'
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
}

export function TodayPage({
  activeEmployee,
  activeEmployeeId,
  activeProfiles,
  onSelectEmployee,
  initialDate,
  onDateConsumed,
  highlightRepeatCard = false,
}: TodayPageProps) {
  const [selectedDate, setSelectedDate] = useState(() => initialDate ?? new Date())
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isRepeating, setIsRepeating] = useState(false)
  const [completedDates, setCompletedDates] = useState<Set<string>>(new Set())
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null)

  const selectedDateKey = formatDateKey(selectedDate)
  const todayDateKey = formatDateKey(new Date())
  const weekdayDates = useMemo(() => getWeekdayDates(selectedDate), [selectedDate])
  const weekdayDateKeys = weekdayDates.map(formatDateKey)

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
  const swipeBindings = useHorizontalSwipe({
    onSwipeLeft: () => setSelectedDate((current) => addDays(current, 1)),
    onSwipeRight: () => setSelectedDate((current) => addDays(current, -1)),
  })

  useEffect(() => {
    if (!initialDate) {
      return
    }

    setSelectedDate(initialDate)
    onDateConsumed?.()
  }, [initialDate, onDateConsumed])

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

    const timeoutId = window.setTimeout(() => {
      setFeedbackMessage('')
      setErrorMessage('')
    }, 3000)

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

  const handleRepeat = async () => {
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
  }

  const handleCreateClient = async (input: { name: string; defaultLocation: string }) => {
    const createdId = await createClient(input)

    if (!createdId) {
      throw new Error('Klant aanmaken mislukt.')
    }

    return createdId
  }

  const handleCreateEntry = async (input: {
    employeeId: number
    date: string
    clientId: number
    location: string
    startTime: string
    endTime: string
    breakMinutes?: number
    travelCreditMinutes?: number
    isDriver?: 'Ja' | 'Nee' | 'Ochtend'
    notes?: string
  }) => {
    await createEntry({ ...input, date: selectedDateKey })
    setFeedbackMessage('Blok opgeslagen.')
    setIsFormOpen(false)
  }

  const handleUpdateEntry = async (input: {
    employeeId: number
    date: string
    clientId: number
    location: string
    startTime: string
    endTime: string
    breakMinutes?: number
    travelCreditMinutes?: number
    isDriver?: 'Ja' | 'Nee' | 'Ochtend'
    notes?: string
  }) => {
    if (!editingEntry?.id) {
      return
    }

    await updateEntry(editingEntry.id, input)
    setFeedbackMessage('Blok bijgewerkt.')
    setEditingEntry(null)
    setIsFormOpen(false)
  }

  const handleDeleteEntry = async () => {
    if (!editingEntry?.id) {
      return
    }

    await deleteEntry(editingEntry.id)
    setFeedbackMessage('Blok verwijderd.')
    setEditingEntry(null)
    setIsFormOpen(false)
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
            <h1>{getDayLabel(selectedDate)}</h1>
            <p>
              {formatLongDate(selectedDate)} · {activeEmployee.exportRecipient}
            </p>
          </div>

          <div className="date-nav" aria-label="Datum navigatie">
            <button type="button" className="secondary-button" onClick={() => setSelectedDate((current) => addDays(current, -1))}>
              ◀
            </button>
            <button type="button" className="secondary-button" onClick={() => setSelectedDate((current) => addDays(current, 1))}>
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
        <section className="panel">
          <EntryForm
            employee={activeEmployee}
            clients={clients}
            suggestedStartTime={suggestedStartTime}
            defaultBreakMinutes={defaultBreakMinutes}
            onSubmit={handleCreateEntry}
            onCreateClient={handleCreateClient}
            onCancel={() => setEditingEntry(null)}
          />
        </section>
      ) : null}

      <Sheet
        open={isFormOpen && (!shouldShowInlineEmptyForm || Boolean(editingEntry))}
        onClose={() => {
          setIsFormOpen(false)
          setEditingEntry(null)
        }}
        title={editingEntry ? 'Blok bewerken' : 'Blok toevoegen'}
      >
        <EntryForm
          employee={activeEmployee}
          clients={clients}
          existingEntry={editingEntry ?? undefined}
          suggestedStartTime={suggestedStartTime}
          defaultBreakMinutes={defaultBreakMinutes}
          onSubmit={editingEntry ? handleUpdateEntry : handleCreateEntry}
          onDelete={editingEntry ? handleDeleteEntry : undefined}
          onCreateClient={handleCreateClient}
          onCancel={() => {
            setIsFormOpen(false)
            setEditingEntry(null)
          }}
        />
      </Sheet>

      <section className="panel">
        <div className="section-heading">
          <h2>Registraties vandaag</h2>
          <span className="muted-text">{selectedDateKey}</span>
        </div>

        {!loading && entries.length === 0 ? (
          <p className="muted-text">
            {isSameDate(selectedDate, new Date())
              ? 'Nog geen blokken vandaag. Gebruik de groene kaart of voeg straks het formulier toe.'
              : 'Nog geen blokken voor deze dag.'}
          </p>
        ) : null}

        <div className="entry-list">
          {entries.map((entry) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              onEdit={() => {
                setEditingEntry(entry)
                setIsFormOpen(true)
              }}
            />
          ))}
        </div>

        <button
          type="button"
          className="add-entry-button"
          onClick={() => {
            setEditingEntry(null)
            setIsFormOpen(true)
          }}
        >
          + Nog een blok toevoegen
        </button>

        <div className="day-total-card">
          <span>Dagtotaal</span>
          <strong>{formatMinutesAsHours(dayTotalMinutes)}</strong>
        </div>
      </section>
    </section>
  )
}
