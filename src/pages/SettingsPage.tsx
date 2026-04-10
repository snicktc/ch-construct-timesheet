import { useEffect, useMemo, useRef, useState } from 'react'

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
import { getDefaultLogoForRecipient, resizeImageToDataUrl } from '../utils/logoUtils'
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
  exportLogo: string
  defaultBreakMinutes: number
  defaultStartTime: string
  isActive: boolean
}

const EMPTY_DRAFT: ProfileDraft = {
  name: '',
  exportRecipient: '',
  exportLogo: '',
  defaultBreakMinutes: 45,
  defaultStartTime: '06:30',
  isActive: true,
}

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
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() =>
    getNotificationSettings(),
  )
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification === 'undefined' ? 'unsupported' : Notification.permission,
  )

  const notificationSupport = getNotificationSupport()
  const importInputRef = useRef<HTMLInputElement | null>(null)
  const logoInputRef = useRef<HTMLInputElement | null>(null)
  const exportRecipientOptions = [...new Set(profiles.map((profile) => profile.exportRecipient).filter(Boolean))]

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

  const startCreate = () => {
    setEditingProfileId(null)
    setDraft(EMPTY_DRAFT)
    setErrorMessage('')
    setSuccessMessage('')
    setIsEditorOpen(true)
  }

  const startEdit = (profile: Employee) => {
    setEditingProfileId(profile.id ?? null)
    setDraft({
      name: profile.name,
      exportRecipient: profile.exportRecipient,
      exportLogo: profile.exportLogo,
      defaultBreakMinutes: profile.defaultBreakMinutes,
      defaultStartTime: profile.defaultStartTime,
      isActive: profile.isActive,
    })
    setErrorMessage('')
    setSuccessMessage('')
    setIsEditorOpen(true)
  }

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!draft.name.trim() || !draft.exportRecipient.trim()) {
      setErrorMessage('Naam en exportbestemmeling zijn verplicht.')
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage('')
      const resolvedLogo = draft.exportLogo || (await getDefaultLogoForRecipient(draft.exportRecipient))
      const profileInput = {
        ...draft,
        exportLogo: resolvedLogo,
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
  }

  const handleToggleActive = async (profile: Employee) => {
    if (!profile.id) {
      return
    }

    try {
      await setProfileActiveState(profile.id, !profile.isActive)
      setSuccessMessage('Profielstatus bijgewerkt.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Profielstatus wijzigen mislukt.')
    }
  }

  const handleDelete = async (profile: Employee) => {
    if (!profile.id) {
      return
    }

    const confirmed = window.confirm(`Verwijder profiel "${profile.name}"?`)

    if (!confirmed) {
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
  }

  const handleExportData = async () => {
    try {
      setErrorMessage('')
      await downloadBackupFile()
      setSuccessMessage('Backup geëxporteerd.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Backup export mislukt.')
    }
  }

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const confirmed = window.confirm(
      'Importeren vervangt alle huidige data in de app. Wil je doorgaan?',
    )

    if (!confirmed) {
      event.target.value = ''
      return
    }

    try {
      setErrorMessage('')
      const text = await file.text()
      await importAllDataFromText(text)
      setSuccessMessage('Data geïmporteerd. De app wordt herladen.')
      window.setTimeout(() => window.location.reload(), 600)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Data import mislukt.')
    } finally {
      event.target.value = ''
    }
  }

  const handleClearAllData = async () => {
    const confirmed = window.confirm(
      'Dit wist alle profielen, klanten, registraties en exporthistoriek. Doorgaan?',
    )

    if (!confirmed) {
      return
    }

    try {
      setErrorMessage('')
      await clearAllAppData()
      setSuccessMessage('Alle data gewist. De app wordt herladen.')
      window.setTimeout(() => window.location.reload(), 600)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Data wissen mislukt.')
    }
  }

  const handleLogoFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    try {
      setErrorMessage('')
      const resizedLogo = await resizeImageToDataUrl(file)
      setDraft((current) => ({ ...current, exportLogo: resizedLogo }))
      setSuccessMessage('Logo geladen.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Logo upload mislukt.')
    } finally {
      event.target.value = ''
    }
  }

  const handleLoadDefaultLogo = async () => {
    try {
      setErrorMessage('')
      const defaultLogo = await getDefaultLogoForRecipient(draft.exportRecipient)

      if (!defaultLogo) {
        throw new Error('Geen standaardlogo beschikbaar voor deze bestemmeling.')
      }

      setDraft((current) => ({ ...current, exportLogo: defaultLogo }))
      setSuccessMessage('Standaardlogo geladen.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Standaardlogo laden mislukt.')
    }
  }

  const moveProfile = async (profile: Employee, direction: -1 | 1) => {
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
  }

  return (
    <section className="today-page">
      {successMessage ? <Toast message={successMessage} tone="success" /> : null}
      {errorMessage ? <Toast message={errorMessage} tone="error" /> : null}

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
          <button type="button" className="secondary-button" onClick={() => setIsEditorOpen(false)}>
            Sluiten
          </button>
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
            <input
              id="employee-recipient"
              value={draft.exportRecipient}
              onChange={(event) =>
                setDraft((current) => ({ ...current, exportRecipient: event.target.value }))
              }
              list="export-recipient-options"
              placeholder="VBW"
            />
            <datalist id="export-recipient-options">
              {exportRecipientOptions.map((option) => (
                <option key={option} value={option} />
              ))}
            </datalist>
          </div>

          <div className="field">
            <label>Logo</label>
            <div className="button-row">
              <button
                type="button"
                className="secondary-button"
                onClick={() => logoInputRef.current?.click()}
              >
                Upload logo
              </button>
              <button
                type="button"
                className="secondary-button"
                onClick={() => void handleLoadDefaultLogo()}
              >
                Laad standaardlogo
              </button>
              {draft.exportLogo ? (
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => setDraft((current) => ({ ...current, exportLogo: '' }))}
                >
                  Verwijder logo
                </button>
              ) : null}
            </div>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="visually-hidden"
              onChange={(event) => void handleLogoFileChange(event)}
            />
            {draft.exportLogo ? (
              <div className="logo-preview-card">
                <img className="logo-preview-image" src={draft.exportLogo} alt="Logo preview" />
              </div>
            ) : (
              <span className="muted-text">Nog geen logo geselecteerd.</span>
            )}
          </div>

          <div className="two-column-grid">
            <div className="field">
              <label htmlFor="employee-break">Standaard pauze</label>
              <input
                id="employee-break"
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
                className={`toggle-button${draft.isActive ? ' is-active' : ''}`}
                onClick={() => setDraft((current) => ({ ...current, isActive: true }))}
              >
                Actief
              </button>
              <button
                type="button"
                className={`toggle-button${!draft.isActive ? ' is-active' : ''}`}
                onClick={() => setDraft((current) => ({ ...current, isActive: false }))}
              >
                Inactief
              </button>
            </div>
          </div>

          <div className="button-row">
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
            <article key={profile.id} className="client-card">
              <div>
                <strong>{profile.name}</strong>
                <p className="muted-text">Export naar: {profile.exportRecipient}</p>
                <p className="muted-text">
                  Pauze: {profile.defaultBreakMinutes} min · Start: {profile.defaultStartTime} ·{' '}
                  {profile.isActive ? 'Actief' : 'Inactief'}
                </p>
                <p className="muted-text">Logo: {profile.exportLogo ? 'Ja' : 'Nee'}</p>
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
                  {profile.isActive ? 'Inactief' : 'Actief'}
                </button>
                <button type="button" className="danger-button" onClick={() => void handleDelete(profile)}>
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
            <span className="muted-text">Status: {notificationPermission}</span>
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
          <button type="button" className="danger-button" onClick={() => void handleClearAllData()}>
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

      <section className="panel muted-text">Versie 1.0.0</section>
    </section>
  )
}
