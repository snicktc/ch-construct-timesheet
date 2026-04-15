import { memo, useCallback, useMemo } from 'react'

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

function ProfileSwitcherComponent({ profiles, activeEmployeeId, onSelect }: ProfileSwitcherProps) {
  const handleSelect = useCallback(
    (profileId: number | undefined) => {
      if (profileId) {
        onSelect(profileId)
      }
    },
    [onSelect],
  )

  const profilesWithBadges = useMemo(
    () =>
      profiles.map((profile) => ({
        ...profile,
        badge: getRecipientBadge(profile.exportRecipient),
      })),
    [profiles],
  )
  return (
    <div className="profile-list" role="tablist" aria-label="Actieve profielen">
      {profilesWithBadges.map((profile) => (
        <button
          key={profile.id}
          type="button"
          className={`profile-chip${profile.id === activeEmployeeId ? ' is-active' : ''}`}
          onClick={() => handleSelect(profile.id)}
          role="tab"
          aria-selected={profile.id === activeEmployeeId}
        >
          {profile.id === activeEmployeeId ? <span className="profile-chip-check">✓</span> : null}
          <span>{profile.name}</span>
          <span className="profile-chip-badge">{profile.badge}</span>
        </button>
      ))}
    </div>
  )
}

export const ProfileSwitcher = memo(ProfileSwitcherComponent)
