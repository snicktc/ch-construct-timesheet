import Dexie, { liveQuery } from 'dexie'
import { useEffect, useMemo, useState } from 'react'

import {
  DEFAULT_BREAK_MINUTES,
  DEFAULT_DRIVER_STATUS,
  DEFAULT_START_TIME,
  type Client,
  type DriverStatus,
  type Employee,
  type TimeEntry,
} from '../db/database'
import { db } from '../db/database'
import type { SaveTimeEntryInput } from '../hooks/useTimeEntry'
import { ClientSelect } from './ClientSelect'

type EntryFormProps = {
  employee: Employee
  clients: Client[]
  dayEntries: TimeEntry[]
  existingEntry?: TimeEntry
  suggestedStartTime?: string
  defaultBreakMinutes?: number
  onSubmit: (input: SaveTimeEntryInput) => Promise<void>
  onDelete?: () => Promise<void>
  onCreateClient: (input: { name: string; defaultLocation: string }) => Promise<number>
  onCancel: () => void
}

const DRIVER_OPTIONS: DriverStatus[] = ['Ja', 'Nee']
const DEFAULT_START_TIME_CHIPS = ['06:00', '06:30', '07:00', '07:30']
const DEFAULT_END_TIME_CHIPS = ['15:30', '16:00', '16:30', '17:00']
const BREAK_OPTIONS = [0, 15, 30, 45, 60]
const HISTORICAL_TIME_SAMPLE_SIZE = 120

const buildTimeChips = (historicalTimes: string[], fallbackTimes: string[], selectedTime: string) => {
  const uniqueTimes = [...new Set([...historicalTimes, ...fallbackTimes])]
  const chips = uniqueTimes.slice(0, 4)

  if (selectedTime && !chips.includes(selectedTime)) {
    chips[3] = selectedTime
  }

  return [...new Set(chips)].slice(0, 4)
}

export function EntryForm({
  employee,
  clients,
  dayEntries,
  existingEntry,
  suggestedStartTime,
  defaultBreakMinutes,
  onSubmit,
  onDelete,
  onCreateClient,
  onCancel,
}: EntryFormProps) {
  const fallbackClientId = useMemo(() => clients[0]?.id ?? null, [clients])
  const selectedClient = clients.find((client) => client.id === (existingEntry?.clientId ?? fallbackClientId))

  const [clientId, setClientId] = useState<number | null>(existingEntry?.clientId ?? fallbackClientId)
  const [location, setLocation] = useState(existingEntry?.location ?? selectedClient?.defaultLocation ?? '')
  const [startTime, setStartTime] = useState(
    existingEntry?.startTime ?? suggestedStartTime ?? employee.defaultStartTime ?? DEFAULT_START_TIME,
  )
  const [endTime, setEndTime] = useState(existingEntry?.endTime ?? '17:00')
  const [breakMinutes, setBreakMinutes] = useState(
    existingEntry?.breakMinutes ?? defaultBreakMinutes ?? employee.defaultBreakMinutes ?? DEFAULT_BREAK_MINUTES,
  )
  const [travelCreditMinutes, setTravelCreditMinutes] = useState(existingEntry?.travelCreditMinutes ?? 0)
  const [isDriver, setIsDriver] = useState<DriverStatus>(existingEntry?.isDriver ?? DEFAULT_DRIVER_STATUS)
  const [notes, setNotes] = useState(existingEntry?.notes ?? '')
  const [newClientName, setNewClientName] = useState('')
  const [newClientLocation, setNewClientLocation] = useState('')
  const [showNewClient, setShowNewClient] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [historicalStartTimes, setHistoricalStartTimes] = useState<string[]>([])
  const [historicalEndTimes, setHistoricalEndTimes] = useState<string[]>([])
  const [showCustomStartTime, setShowCustomStartTime] = useState(false)
  const [showCustomEndTime, setShowCustomEndTime] = useState(false)
  const [showMoreOptions, setShowMoreOptions] = useState(
    Boolean(existingEntry?.travelCreditMinutes || existingEntry?.notes),
  )

  useEffect(() => {
    if (!clientId) {
      return
    }

    const client = clients.find((item) => item.id === clientId)

    if (client && !existingEntry) {
      setLocation((current) => current || client.defaultLocation)
    }
  }, [clientId, clients, existingEntry])

  useEffect(() => {
    if (!employee.id) {
      setHistoricalStartTimes([])
      setHistoricalEndTimes([])
      return
    }

    const subscription = liveQuery(async () => {
      const allEntries = await db.timeEntries
        .where('[employeeId+date]')
        .between([employee.id, Dexie.minKey], [employee.id, Dexie.maxKey], true, true)
        .reverse()
        .limit(HISTORICAL_TIME_SAMPLE_SIZE)
        .toArray()
      const startFrequency = new Map<string, number>()
      const endFrequency = new Map<string, number>()

      for (const entry of allEntries) {
        startFrequency.set(entry.startTime, (startFrequency.get(entry.startTime) ?? 0) + 1)
        endFrequency.set(entry.endTime, (endFrequency.get(entry.endTime) ?? 0) + 1)
      }

      const sortByFrequency = (input: Map<string, number>) =>
        [...input.entries()]
          .sort((left, right) => right[1] - left[1] || left[0].localeCompare(right[0]))
          .map(([time]) => time)

      return {
        startTimes: sortByFrequency(startFrequency),
        endTimes: sortByFrequency(endFrequency),
      }
    }).subscribe({
      next: (snapshot) => {
        setHistoricalStartTimes(snapshot.startTimes)
        setHistoricalEndTimes(snapshot.endTimes)
      },
      error: (error) => {
        console.error('Failed to load historical times', error)
      },
    })

    return () => subscription.unsubscribe()
  }, [employee.id])

  const startTimeChips = useMemo(
    () => buildTimeChips(historicalStartTimes, DEFAULT_START_TIME_CHIPS, startTime),
    [historicalStartTimes, startTime],
  )
  const endTimeChips = useMemo(
    () => buildTimeChips(historicalEndTimes, DEFAULT_END_TIME_CHIPS, endTime),
    [endTime, historicalEndTimes],
  )

  const handleCreateClient = async () => {
    if (!newClientName.trim() || !newClientLocation.trim()) {
      setErrorMessage('Nieuwe klant vereist naam en standaard locatie.')
      return
    }

    const nextId = await onCreateClient({
      name: newClientName,
      defaultLocation: newClientLocation,
    })

    setClientId(nextId)
    setLocation(newClientLocation)
    setShowNewClient(false)
    setNewClientName('')
    setNewClientLocation('')
    setErrorMessage('')
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!clientId) {
      setErrorMessage('Klant is verplicht.')
      return
    }

    if (!location.trim()) {
      setErrorMessage('Locatie is verplicht.')
      return
    }

    if (!startTime || !endTime || endTime <= startTime) {
      setErrorMessage('Eindtijd moet later zijn dan starttijd.')
      return
    }

    const overlappingEntries = dayEntries.filter((entry) => {
      if (existingEntry?.id && entry.id === existingEntry.id) {
        return false
      }

      return startTime < entry.endTime && endTime > entry.startTime
    })

    if (overlappingEntries.length > 0) {
      const confirmed = window.confirm(
        'Deze uren overlappen met een bestaand blok op dezelfde dag. Wil je toch doorgaan?',
      )

      if (!confirmed) {
        return
      }
    }

    try {
      setIsSaving(true)
      setErrorMessage('')
      await onSubmit({
        employeeId: employee.id!,
        date: existingEntry?.date ?? '',
        clientId,
        location,
        startTime,
        endTime,
        breakMinutes,
        travelCreditMinutes,
        isDriver,
        notes,
      })
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Opslaan mislukt.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!onDelete) {
      return
    }

    const confirmed = window.confirm('Verwijder dit blok?')

    if (!confirmed) {
      return
    }

    try {
      setIsDeleting(true)
      await onDelete()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Verwijderen mislukt.')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <section className="entry-form-panel">
      <div className="section-heading">
        <h2>{existingEntry ? 'Blok bewerken' : 'Blok toevoegen'}</h2>
        <button type="button" className="secondary-button" onClick={onCancel}>
          Terug
        </button>
      </div>

      <form className="entry-form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Klant</label>
          <ClientSelect
            clients={clients}
            value={clientId}
            onChange={(nextClientId) => {
              setClientId(nextClientId)
              const client = clients.find((item) => item.id === nextClientId)
              if (client) {
                setLocation(client.defaultLocation)
              }
            }}
            onCreateNew={() => setShowNewClient(true)}
          />
        </div>

        {showNewClient ? (
          <div className="inline-panel">
            <div className="field">
              <label>Nieuwe klantnaam</label>
              <input value={newClientName} onChange={(event) => setNewClientName(event.target.value)} />
            </div>
            <div className="field">
              <label>Standaard locatie</label>
              <input value={newClientLocation} onChange={(event) => setNewClientLocation(event.target.value)} />
            </div>
            <div className="button-row">
              <button type="button" className="secondary-button" onClick={() => void handleCreateClient()}>
                Klant opslaan
              </button>
              <button type="button" className="secondary-button" onClick={() => setShowNewClient(false)}>
                Sluiten
              </button>
            </div>
          </div>
        ) : null}

        <div className="field">
          <label>Locatie</label>
          <input value={location} onChange={(event) => setLocation(event.target.value)} />
        </div>

        <div className="field">
          <label>Start</label>
          <div className="chip-row">
            {startTimeChips.map((time) => (
              <button
                key={time}
                type="button"
                className={`time-chip${startTime === time ? ' is-active' : ''}`}
                onClick={() => {
                  setStartTime(time)
                  setShowCustomStartTime(false)
                }}
              >
                {time}
              </button>
            ))}
            <button
              type="button"
              className={`time-chip${showCustomStartTime ? ' is-active' : ''}`}
              onClick={() => setShowCustomStartTime(true)}
            >
              Ander...
            </button>
          </div>
          {showCustomStartTime ? (
            <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
          ) : null}
        </div>

        <div className="field">
          <label>Einde</label>
          <div className="chip-row">
            {endTimeChips.map((time) => (
              <button
                key={time}
                type="button"
                className={`time-chip${endTime === time ? ' is-active' : ''}`}
                onClick={() => {
                  setEndTime(time)
                  setShowCustomEndTime(false)
                }}
              >
                {time}
              </button>
            ))}
            <button
              type="button"
              className={`time-chip${showCustomEndTime ? ' is-active' : ''}`}
              onClick={() => setShowCustomEndTime(true)}
            >
              Ander...
            </button>
          </div>
          {showCustomEndTime ? (
            <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} />
          ) : null}
        </div>

        <div className="field">
          <label>Pauze</label>
          <div className="chip-row">
            {BREAK_OPTIONS.map((minutes) => (
              <button
                key={minutes}
                type="button"
                className={`time-chip${breakMinutes === minutes ? ' is-active' : ''}`}
                onClick={() => setBreakMinutes(minutes)}
              >
                {minutes} min
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Chauffeur</label>
          <div className="toggle-row">
            {DRIVER_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`toggle-button${isDriver === option ? ' is-active' : ''}`}
                onClick={() => setIsDriver(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <button
            type="button"
            className="more-options-button"
            onClick={() => setShowMoreOptions((current) => !current)}
          >
            {showMoreOptions ? '▾' : '▸'} Meer opties
          </button>
        </div>

        {showMoreOptions ? (
          <div className="inline-panel">
            <div className="field">
              <label>Rit-credit (min)</label>
              <input
                type="number"
                min="0"
                step="5"
                value={travelCreditMinutes}
                onChange={(event) => setTravelCreditMinutes(Number(event.target.value) || 0)}
              />
            </div>

            <div className="field">
              <label>Notities</label>
              <textarea
                className="textarea-input"
                value={notes}
                maxLength={160}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>
          </div>
        ) : null}

        {errorMessage ? <p className="error-text">{errorMessage}</p> : null}

        <div className="button-row">
          <button type="submit" className="primary-button" disabled={isSaving || isDeleting}>
            {isSaving ? 'Opslaan...' : 'Opslaan'}
          </button>
          <button type="button" className="secondary-button" onClick={onCancel} disabled={isSaving || isDeleting}>
            Annuleer
          </button>
          {onDelete ? (
            <button type="button" className="danger-button" onClick={() => void handleDelete()} disabled={isSaving || isDeleting}>
              {isDeleting ? 'Verwijderen...' : 'Verwijder blok'}
            </button>
          ) : null}
        </div>
      </form>
    </section>
  )
}
