import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { ConfirmDialog } from '../components/ConfirmDialog'
import { ProfileSwitcher } from '../components/ProfileSwitcher'
import { Sheet } from '../components/Sheet'
import { Toast } from '../components/Toast'
import type { Employee } from '../db/database'
import { useProfiles } from '../hooks/useProfiles'
import {
  clearAllAppData,
  downloadBackupFile,
  importAllDataFromText,
} from '../utils/dataTransfer'
import { getDefaultLogoPathForRecipient } from '../utils/logoUtils'
import {
  getNotificationSettings,
  getNotificationSupport,
  requestNotificationPermission,
  saveNotificationSettings,
  showAppNotification,
  type NotificationSettings,
} from '../utils/notifications'

type SettingsPageProps = {
  activeEmployeeId: number
  activeProfiles: Employee[]
  onSelectEmployee: (employeeId: number) => void
}

type ProfileDraft = {
  name: string
  exportRecipient: string
  defaultBreakMinutes: number
  defaultStartTime: string
  isActive: boolean
}

const EMPTY_DRAFT: ProfileDraft = {
  name: '',
  exportRecipient: '',
  defaultBreakMinutes: 45,
  defaultStartTime: '06:30',
  isActive: true,
}

const EXPORT_RECIPIENT_OPTIONS = ['CH Construct', 'VBW'] as const

export function SettingsPage({
  activeEmployeeId,
  activeProfiles,
  onSelectEmployee,
}: SettingsPageProps) {
  const {
    profiles,
    loading,
    createProfile,
    updateProfile,
    setProfileActiveState,
    deleteProfile,
  } = useProfiles()
  const [editingProfileId, setEditingProfileId] = useState<number | null>(null)
  const [draft, setDraft] = useState<ProfileDraft>(EMPTY_DRAFT)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [profilePendingDelete, setProfilePendingDelete] = useState<Employee | null>(null)
  const [profilePendingToggle, setProfilePendingToggle] = useState<Employee | null>(null)
  const [pendingImportText, setPendingImportText] = useState<string | null>(null)
  const [confirmClearAllData, setConfirmClearAllData] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    getNotificationSettings(),
  )
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )

  const notificationSupport = getNotificationSupport()
  const importInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    saveNotificationSettings(notificationSettings)
  }, [notificationSettings])

  useEffect(() => {
    if (!errorMessage && !successMessage) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setErrorMessage('')
      setSuccessMessage('')
    }, 3000)

    return () => window.clearTimeout(timeoutId)
  }, [errorMessage, successMessage])

  const editingProfile = useMemo(
    () => profiles.find((profile) => profile.id === editingProfileId) ?? null,
    [profiles, editingProfileId],
  )
  const selectedLogoPath = useMemo(
    () => getDefaultLogoPathForRecipient(draft.exportRecipient),
    [draft.exportRecipient],
  )
  const selectedLogoSrc = selectedLogoPath ? `${import.meta.env.BASE_URL}${selectedLogoPath}` : ''

  const startCreate = useCallback(() => {
    setEditingProfileId(null)
    setDraft(EMPTY_DRAFT)
    setErrorMessage('')
    setSuccessMessage('')
    setIsEditorOpen(true)
  }, [])

  const startEdit = useCallback((profile: Employee) => {
    setEditingProfileId(profile.id ?? null)
    setDraft({
      name: profile.name,
      exportRecipient: profile.exportRecipient,
      defaultBreakMinutes: profile.defaultBreakMinutes,
      defaultStartTime: profile.defaultStartTime,
      isActive: profile.isActive,
    })
    setErrorMessage('')
    setSuccessMessage('')
    setIsEditorOpen(true)
  }, [])

  const handleSave = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      if (!draft.name.trim() || !draft.exportRecipient.trim()) {
        setErrorMessage('Naam en exportbestemmeling zijn verplicht.')
        return
      }

      try {
        setIsSaving(true)
        setErrorMessage('')
        const profileInput = {
          ...draft,
        }

        if (editingProfileId) {
          await updateProfile(editingProfileId, profileInput)
        } else {
          await createProfile(profileInput)
        }

        setEditingProfileId(null)
        setDraft(EMPTY_DRAFT)
        setSuccessMessage('Profiel opgeslagen.')
        setIsEditorOpen(false)
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Profiel opslaan mislukt.')
      } finally {
        setIsSaving(false)
      }
    },
    [draft, editingProfileId, updateProfile, createProfile],
  )

  const handleToggleActive = useCallback(
    async (profile: Employee) => {
      if (!profile.id) {
        return
      }

      // Als actief → inactief: toon bevestiging
      if (profile.isActive) {
        setProfilePendingToggle(profile)
        return
      }

      // Als inactief → actief: direct uitvoeren
      try {
        await setProfileActiveState(profile.id, true)
        setSuccessMessage('Profielstatus bijgewerkt.')
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Profielstatus wijzigen mislukt.')
      }
    },
    [setProfileActiveState],
  )

  const confirmToggleInactive = useCallback(async () => {
    if (!profilePendingToggle?.id) {
      return
    }

    try {
      await setProfileActiveState(profilePendingToggle.id, false)
      setSuccessMessage('Profielstatus bijgewerkt.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Profielstatus wijzigen mislukt.')
    } finally {
      setProfilePendingToggle(null)
    }
  }, [profilePendingToggle, setProfileActiveState])

  const handleDelete = useCallback(
    async (profile: Employee) => {
      if (!profile.id) {
        return
      }

      try {
        await deleteProfile(profile.id)

        if (editingProfileId === profile.id) {
          setEditingProfileId(null)
          setDraft(EMPTY_DRAFT)
          setIsEditorOpen(false)
        }

        setSuccessMessage('Profiel verwijderd.')
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Profiel verwijderen mislukt.')
      }
    },
    [deleteProfile, editingProfileId],
  )

  const handleExportData = useCallback(async () => {
    try {
      setErrorMessage('')
      await downloadBackupFile()
      setSuccessMessage('Backup geëxporteerd.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Backup export mislukt.')
    }
  }, [])

  const handleImportFile = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      setErrorMessage('')
      const text = await file.text()
      setPendingImportText(text)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Data import mislukt.')
    } finally {
      event.target.value = ''
    }
  }, [])

  const handleClearAllData = useCallback(async () => {
    try {
      setErrorMessage('')
      await clearAllAppData()
      setSuccessMessage('Alle data gewist. De app wordt herladen.')
      window.setTimeout(() => window.location.reload(), 600)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Data wissen mislukt.')
    }
  }, [])

  const moveProfile = useCallback(
    async (profile: Employee, direction: -1 | 1) => {
      const currentIndex = profiles.findIndex((item) => item.id === profile.id)
      const targetIndex = currentIndex + direction

      if (currentIndex < 0 || targetIndex < 0 || targetIndex >= profiles.length) {
        return
      }

      const reordered = [...profiles]
      const [moved] = reordered.splice(currentIndex, 1)
      reordered.splice(targetIndex, 0, moved)

      await Promise.all(
        reordered.map((item, index) => (item.id ? updateProfile(item.id, { sortOrder: index }) : Promise.resolve())),
      )
      setSuccessMessage('Profielvolgorde bijgewerkt.')
    },
    [profiles, updateProfile],
  )

  return (
    <section className="today-page">
      {successMessage ? <Toast message={successMessage} tone="success" /> : null}
      {errorMessage ? <Toast message={errorMessage} tone="error" /> : null}

      <ConfirmDialog
        open={Boolean(profilePendingDelete)}
        title="Profiel verwijderen"
        message={profilePendingDelete ? `Weet je zeker dat je profiel ${profilePendingDelete.name} wilt verwijderen?` : ''}
        confirmLabel="Ja, verwijder"
        cancelLabel="Nee, bewaren"
        tone="danger"
        onCancel={() => setProfilePendingDelete(null)}
        onConfirm={() => {
          const profile = profilePendingDelete
          setProfilePendingDelete(null)

          if (profile) {
            void handleDelete(profile)
          }
        }}
      />

      <ConfirmDialog
        open={Boolean(profilePendingToggle)}
        title="Profiel inactief maken"
        message={profilePendingToggle ? `${profilePendingToggle.name} wordt inactief gemaakt. Je kunt het later weer activeren.` : ''}
        confirmLabel="Ja, maak inactief"
        cancelLabel="Annuleer"
        tone="default"
        onCancel={() => setProfilePendingToggle(null)}
        onConfirm={() => void confirmToggleInactive()}
      />

      <ConfirmDialog
        open={pendingImportText !== null}
        title="Data importeren"
        message="Deze backup vervangt alle huidige gegevens in de app op dit toestel. Wil je verdergaan?"
        confirmLabel="Ja, importeer"
        cancelLabel="Nee, annuleren"
        tone="danger"
        onCancel={() => setPendingImportText(null)}
        onConfirm={() => {
          const text = pendingImportText
          setPendingImportText(null)

          if (!text) {
            return
          }

          void (async () => {
            try {
              await importAllDataFromText(text)
              setSuccessMessage('Data geïmporteerd. De app wordt herladen.')
              window.setTimeout(() => window.location.reload(), 600)
            } catch (error) {
              setErrorMessage(error instanceof Error ? error.message : 'Data import mislukt.')
            }
          })()
        }}
      />

      <ConfirmDialog
        open={confirmClearAllData}
        title="Alle data wissen"
        message="Dit wist alle profielen, klanten, registraties en exporthistoriek op dit toestel. Wil je doorgaan?"
        confirmLabel="Ja, wis alles"
        cancelLabel="Nee, annuleren"
        tone="danger"
        onCancel={() => setConfirmClearAllData(false)}
        onConfirm={() => {
          setConfirmClearAllData(false)
          void handleClearAllData()
        }}
      />

      <header className="today-header">
        <ProfileSwitcher
          profiles={activeProfiles}
          activeEmployeeId={activeEmployeeId}
          onSelect={onSelectEmployee}
        />

        <div className="today-header-meta">
          <div>
            <h1>Meer</h1>
            <p>Profielbeheer en basisinstellingen.</p>
          </div>

          <button type="button" className="secondary-button" onClick={startCreate}>
            + Nieuw
          </button>
        </div>
      </header>

      <Sheet open={isEditorOpen} onClose={() => setIsEditorOpen(false)} title={editingProfile ? 'Profiel bewerken' : 'Nieuw profiel'}>
        <div className="section-heading">
          <h2>{editingProfile ? 'Profiel bewerken' : 'Nieuw profiel'}</h2>
        </div>

        <form className="entry-form" onSubmit={handleSave}>
          <div className="field">
            <label htmlFor="employee-name">Naam</label>
            <input
              id="employee-name"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Kevin"
            />
          </div>

          <div className="field">
            <label htmlFor="employee-recipient">Export naar</label>
            <select
              id="employee-recipient"
              value={draft.exportRecipient}
              onChange={(event) => setDraft((current) => ({ ...current, exportRecipient: event.target.value }))}
            >
              <option value="" disabled>
                Kies een bestemmeling
              </option>
              {EXPORT_RECIPIENT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {selectedLogoSrc ? (
              <div className="logo-preview-card">
                <img
                  className="logo-preview-image"
                  src={selectedLogoSrc}
                  alt={`Logo ${draft.exportRecipient}`}
                />
              </div>
            ) : (
              <span className="muted-text">Geen logo beschikbaar voor deze bestemmeling.</span>
            )}
          </div>

          <div className="two-column-grid">
            <div className="field">
              <label htmlFor="employee-break">Standaard pauze</label>
              <input
                id="employee-break"
                className="compact-number-input"
                type="number"
                min="0"
                value={draft.defaultBreakMinutes}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    defaultBreakMinutes: Number(event.target.value) || 0,
                  }))
                }
              />
            </div>

            <div className="field">
              <label htmlFor="employee-start">Standaard start</label>
              <input
                id="employee-start"
                type="time"
                value={draft.defaultStartTime}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, defaultStartTime: event.target.value }))
                }
              />
            </div>
          </div>

          <div className="field">
            <label>Status</label>
            <div className="toggle-row">
              <button
                type="button"
                className={`toggle-button toggle-button-status${draft.isActive ? ' is-active' : ''}`}
                onClick={() => setDraft((current) => ({ ...current, isActive: true }))}
              >
                Actief
              </button>
              <button
                type="button"
                className={`toggle-button toggle-button-status${!draft.isActive ? ' is-active' : ''}`}
                onClick={() => setDraft((current) => ({ ...current, isActive: false }))}
              >
                Inactief
              </button>
            </div>
          </div>

          <div className="button-row">
            <button type="button" className="secondary-button" onClick={() => setIsEditorOpen(false)}>
              Annuleer
            </button>
            <button className="primary-button" type="submit" disabled={isSaving}>
              {isSaving ? 'Opslaan...' : 'Opslaan'}
            </button>
          </div>
        </form>
      </Sheet>

      <section className="panel">
        <div className="section-heading">
          <h2>Profielen</h2>
          <span className="muted-text">{profiles.length} totaal</span>
        </div>

        {loading ? <p className="muted-text">Profielen laden...</p> : null}

        <div className="client-list">
          {profiles.map((profile) => (
            <article key={profile.id} className={`client-card${!profile.isActive ? ' is-inactive' : ''}`}>
              <div>
                <strong>{profile.name}</strong>
                <p className="muted-text">Export naar: {profile.exportRecipient}</p>
                <p className="muted-text">
                  Pauze: {profile.defaultBreakMinutes} min · Start: {profile.defaultStartTime} ·{' '}
                  {profile.isActive ? 'Actief' : 'Inactief'}
                </p>
              </div>

              <div className="button-row client-card-actions">
                <button type="button" className="secondary-button" onClick={() => void moveProfile(profile, -1)}>
                  ↑
                </button>
                <button type="button" className="secondary-button" onClick={() => void moveProfile(profile, 1)}>
                  ↓
                </button>
                <button type="button" className="secondary-button" onClick={() => startEdit(profile)}>
                  ✎ Bewerk
                </button>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => void handleToggleActive(profile)}
                >
                  {profile.isActive ? 'Zet op inactief' : 'Zet op actief'}
                </button>
                <button type="button" className="danger-button" onClick={() => setProfilePendingDelete(profile)}>
                  Verwijder
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Notificaties</h2>
        <div className="entry-form">
          <div className="field">
            <label>Toestemming</label>
            <div className="button-row">
              <button
                type="button"
                className="secondary-button"
                onClick={async () => setNotificationPermission(await requestNotificationPermission())}
                disabled={!notificationSupport.notifications}
              >
                Vraag notificaties toe
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() =>
                  void showAppNotification('Werkdag loggen?', {
                    body: 'Dit is een testnotificatie van timesheet.',
                    tag: 'test-notification',
                  }).catch((error: unknown) => {
                    setErrorMessage(
                      error instanceof Error ? error.message : 'Testnotificatie mislukt.',
                    )
                  })
                }
                disabled={notificationPermission !== 'granted'}
              >
                Test notificatie
              </button>
            </div>
            <span className="muted-text">Status: {notificationPermission === 'granted' ? 'Toegestaan' : notificationPermission === 'denied' ? 'Geweigerd' : notificationPermission === 'default' ? 'Niet ingesteld' : 'Niet ondersteund'}</span>
          </div>

          <div className="field">
            <label>Dagelijkse herinnering</label>
            <div className="toggle-row">
              <button
                type="button"
                className={`toggle-button${notificationSettings.dailyReminderEnabled ? ' is-active' : ''}`}
                onClick={() =>
                  setNotificationSettings((current) => ({ ...current, dailyReminderEnabled: true }))
                }
              >
                Aan
              </button>
              <button
                type="button"
                className={`toggle-button${!notificationSettings.dailyReminderEnabled ? ' is-active' : ''}`}
                onClick={() =>
                  setNotificationSettings((current) => ({ ...current, dailyReminderEnabled: false }))
                }
              >
                Uit
              </button>
            </div>
          </div>

          <div className="field">
            <label htmlFor="daily-reminder-time">Tijd dagelijkse herinnering</label>
            <input
              id="daily-reminder-time"
              type="time"
              value={notificationSettings.dailyReminderTime}
              onChange={(event) =>
                setNotificationSettings((current) => ({
                  ...current,
                  dailyReminderTime: event.target.value,
                }))
              }
            />
          </div>

          <div className="field">
            <label>Vrijdag export-prompt</label>
            <div className="toggle-row">
              <button
                type="button"
                className={`toggle-button${notificationSettings.fridayExportPromptEnabled ? ' is-active' : ''}`}
                onClick={() =>
                  setNotificationSettings((current) => ({
                    ...current,
                    fridayExportPromptEnabled: true,
                  }))
                }
              >
                Aan
              </button>
              <button
                type="button"
                className={`toggle-button${!notificationSettings.fridayExportPromptEnabled ? ' is-active' : ''}`}
                onClick={() =>
                  setNotificationSettings((current) => ({
                    ...current,
                    fridayExportPromptEnabled: false,
                  }))
                }
              >
                Uit
              </button>
            </div>
          </div>

          <p className="muted-text">
            Herinneringen worden lokaal beheerd en getoond wanneer het toestel notificaties en
            service workers ondersteunt.
          </p>
        </div>
      </section>

      <section className="panel">
        <h2>Data</h2>
        <div className="button-row">
          <button type="button" className="secondary-button" onClick={() => void handleExportData()}>
            Exporteer alle data
          </button>
          <button
            type="button"
            className="secondary-button"
            onClick={() => importInputRef.current?.click()}
          >
            Importeer data
          </button>
          <button type="button" className="danger-button" onClick={() => setConfirmClearAllData(true)}>
            Wis alle data
          </button>
        </div>
        <input
          ref={importInputRef}
          type="file"
          accept="application/json,.json"
          className="visually-hidden"
          onChange={(event) => void handleImportFile(event)}
        />
      </section>

      <section className="panel muted-text">
        <div>Versie 1.0.0</div>
        <div style={{ fontSize: '0.85em', marginTop: '0.25rem' }}>
          Laatste update: {new Date(__BUILD_TIMESTAMP__).toLocaleString('nl-NL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </section>
    </section>
  )
}
