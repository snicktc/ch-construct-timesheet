import { memo, useCallback, useMemo } from 'react'

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

  if (!first || !last) {
    return {
      clientLabel: 'Geen entries',
      timeLabel: '-',
      metaLabel: '-',
      driverLabel: '-',
    }
  }

  return {
    clientLabel:
      entries.length === 1
        ? `${first.clientName} - ${first.location}`
        : `${first.clientName} + ${entries.length - 1} extra`,
    timeLabel: `${first.startTime}-${last.endTime}`,
    metaLabel: `pauze ${entries.reduce((total, entry) => total + entry.breakMinutes, 0)}m · ${formatMinutesAsHours(calculateDayTotalMinutes(entries))}`,
    driverLabel: `chauffeur: ${first.isDriver.toLowerCase()}`,
  }
}

function RepeatCardComponent({ entries, onRepeat, disabled = false }: RepeatCardProps) {
  const handleRepeat = useCallback(() => {
    void onRepeat()
  }, [onRepeat])

  const summary = useMemo(() => getRepeatSummary(entries), [entries])
  if (entries.length === 0) {
    return null
  }

  return (
    <button type="button" className="repeat-card" onClick={handleRepeat} disabled={disabled}>
      <span className="eyebrow">Zelfde als gisteren?</span>
      <strong>{summary.clientLabel}</strong>
      <span>{summary.timeLabel}</span>
      <span>{summary.metaLabel}</span>
      <span>{summary.driverLabel}</span>
      <span className="repeat-card-cta">Tik om direct op te slaan</span>
    </button>
  )
}

export const RepeatCard = memo(RepeatCardComponent)
