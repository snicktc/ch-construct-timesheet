import type { Employee } from '../db/database'

type ProfileSwitcherProps = {
  profiles: Employee[]
  activeEmployeeId: number | null
  onSelect: (employeeId: number) => void
}

const getRecipientBadge = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 3)

export function ProfileSwitcher({ profiles, activeEmployeeId, onSelect }: ProfileSwitcherProps) {
  return (
    <div className="profile-list" role="tablist" aria-label="Actieve profielen">
      {profiles.map((profile) => (
        <button
          key={profile.id}
          type="button"
          className={`profile-chip${profile.id === activeEmployeeId ? ' is-active' : ''}`}
          onClick={() => profile.id && onSelect(profile.id)}
        >
          <span>{profile.name}</span>
          <span className="profile-chip-badge">{getRecipientBadge(profile.exportRecipient)}</span>
        </button>
      ))}
    </div>
  )
}
