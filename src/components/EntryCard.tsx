import { memo } from 'react'

import type { TimeEntry } from '../db/database'
import { calculateEntryMinutes, formatMinutesAsHours } from '../utils/timeCalc'

type EntryCardProps = {
  entry: TimeEntry
  onEdit: () => void
}

function EntryCardComponent({ entry, onEdit }: EntryCardProps) {
  return (
    <article className="entry-card">
      <div className="entry-card-header">
        <strong>
          {entry.clientName || 'Onbekend'} - {entry.location || 'Geen locatie'}
        </strong>
        <button type="button" className="entry-edit-button" onClick={onEdit} aria-label="Bewerk registratie">
          ✎
        </button>
      </div>
      <div className="entry-card-times">
        <span>
          {entry.startTime}-{entry.endTime}
        </span>
        <strong>{formatMinutesAsHours(calculateEntryMinutes(entry))}</strong>
      </div>
      {entry.notes ? <p className="entry-notes">{entry.notes}</p> : null}
    </article>
  )
}

export const EntryCard = memo(EntryCardComponent)
