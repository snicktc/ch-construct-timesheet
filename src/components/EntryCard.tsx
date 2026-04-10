import type { TimeEntry } from '../db/database'
import { calculateEntryMinutes, formatMinutesAsHours } from '../utils/timeCalc'

type EntryCardProps = {
  entry: TimeEntry
  onEdit: () => void
}

export function EntryCard({ entry, onEdit }: EntryCardProps) {
  return (
    <article className="entry-card">
      <div className="entry-card-header">
        <strong>
          {entry.clientName} - {entry.location}
        </strong>
        <button type="button" className="entry-edit-button" onClick={onEdit}>
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
