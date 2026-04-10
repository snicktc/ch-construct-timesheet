import type { TimeEntry } from '../db/database'
import { calculateDayTotalMinutes, formatMinutesAsHours } from '../utils/timeCalc'

type RepeatCardProps = {
  entries: TimeEntry[]
  onRepeat: () => Promise<void>
  disabled?: boolean
}

const getRepeatSummary = (entries: TimeEntry[]) => {
  const first = entries[0]
  const last = entries[entries.length - 1]

  return {
    clientLabel:
      entries.length === 1
        ? `${first.clientName} - ${first.location}`
        : `${first.clientName} + ${entries.length - 1} extra blok${entries.length > 2 ? 'ken' : ''}`,
    timeLabel: `${first.startTime}-${last.endTime}`,
    metaLabel: `pauze ${entries.reduce((total, entry) => total + entry.breakMinutes, 0)}m · ${formatMinutesAsHours(calculateDayTotalMinutes(entries))}`,
    driverLabel: `chauffeur: ${first.isDriver.toLowerCase()}`,
  }
}

export function RepeatCard({ entries, onRepeat, disabled = false }: RepeatCardProps) {
  if (entries.length === 0) {
    return null
  }

  const summary = getRepeatSummary(entries)

  return (
    <button type="button" className="repeat-card" onClick={() => void onRepeat()} disabled={disabled}>
      <span className="eyebrow">Zelfde als gisteren?</span>
      <strong>{summary.clientLabel}</strong>
      <span>{summary.timeLabel}</span>
      <span>{summary.metaLabel}</span>
      <span>{summary.driverLabel}</span>
      <span className="repeat-card-cta">Tik om direct op te slaan</span>
    </button>
  )
}
