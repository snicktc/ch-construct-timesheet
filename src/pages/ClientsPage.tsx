import { useEffect, useMemo, useState } from 'react'

import { ProfileSwitcher } from '../components/ProfileSwitcher'
import { Sheet } from '../components/Sheet'
import { Toast } from '../components/Toast'
import type { Employee, Client } from '../db/database'
import { useClients } from '../hooks/useClients'

type ClientsPageProps = {
  activeEmployeeId: number
  activeProfiles: Employee[]
  onSelectEmployee: (employeeId: number) => void
}

type ClientDraft = {
  name: string
  defaultLocation: string
}

const EMPTY_DRAFT: ClientDraft = {
  name: '',
  defaultLocation: '',
}

export function ClientsPage({
  activeEmployeeId,
  activeProfiles,
  onSelectEmployee,
}: ClientsPageProps) {
  const { clients, loading, createClient, updateClient, deleteClient } = useClients()
  const [draft, setDraft] = useState<ClientDraft>(EMPTY_DRAFT)
  const [editingClientId, setEditingClientId] = useState<number | null>(null)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isEditorOpen, setIsEditorOpen] = useState(false)

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

  const editingClient = useMemo(
    () => clients.find((client) => client.id === editingClientId) ?? null,
    [clients, editingClientId],
  )

  const startCreate = () => {
    setEditingClientId(null)
    setDraft(EMPTY_DRAFT)
    setErrorMessage('')
    setSuccessMessage('')
    setIsEditorOpen(true)
  }

  const startEdit = (client: Client) => {
    setEditingClientId(client.id ?? null)
    setDraft({
      name: client.name,
      defaultLocation: client.defaultLocation,
    })
    setErrorMessage('')
    setSuccessMessage('')
    setIsEditorOpen(true)
  }

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!draft.name.trim() || !draft.defaultLocation.trim()) {
      setErrorMessage('Klantnaam en standaard locatie zijn verplicht.')
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage('')

      if (editingClientId) {
        await updateClient(editingClientId, draft)
      } else {
        await createClient(draft)
      }

      setDraft(EMPTY_DRAFT)
      setEditingClientId(null)
      setSuccessMessage('Klant opgeslagen.')
      setIsEditorOpen(false)
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Klant opslaan mislukt.')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (client: Client) => {
    if (!client.id) {
      return
    }

    const confirmed = window.confirm(`Verwijder klant "${client.name}"?`)

    if (!confirmed) {
      return
    }

    try {
      await deleteClient(client.id)

      if (editingClientId === client.id) {
        setEditingClientId(null)
        setDraft(EMPTY_DRAFT)
        setIsEditorOpen(false)
      }

      setSuccessMessage('Klant verwijderd.')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Klant verwijderen mislukt.')
    }
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
            <h1>Klanten</h1>
            <p>Gedeelde klanten- en locatieslijst voor alle profielen.</p>
          </div>

          <button type="button" className="secondary-button" onClick={startCreate}>
            + Nieuw
          </button>
        </div>
      </header>

      <Sheet open={isEditorOpen} onClose={() => setIsEditorOpen(false)} title={editingClient ? 'Klant bewerken' : 'Nieuwe klant'}>
        <div className="section-heading">
          <h2>{editingClient ? 'Klant bewerken' : 'Nieuwe klant'}</h2>
          <button type="button" className="secondary-button" onClick={() => setIsEditorOpen(false)}>
            Sluiten
          </button>
        </div>

        <form className="entry-form" onSubmit={handleSave}>
          <div className="field">
            <label htmlFor="client-name">Klantnaam</label>
            <input
              id="client-name"
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="Mathys"
            />
          </div>

          <div className="field">
            <label htmlFor="client-location">Standaard locatie</label>
            <input
              id="client-location"
              value={draft.defaultLocation}
              onChange={(event) =>
                setDraft((current) => ({ ...current, defaultLocation: event.target.value }))
              }
              placeholder="Damme"
            />
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
          <h2>Alle klanten</h2>
          <span className="muted-text">{clients.length} totaal</span>
        </div>

        {loading ? <p className="muted-text">Klanten laden...</p> : null}

        {!loading && clients.length === 0 ? (
          <p className="muted-text">Nog geen klanten aangemaakt.</p>
        ) : null}

        <div className="client-list">
          {clients.map((client) => (
            <article key={client.id} className="client-card">
              <div>
                <strong>
                  {client.name} - {client.defaultLocation}
                </strong>
                <p className="muted-text">
                  Laatst gebruikt: {client.lastUsedAt ? client.lastUsedAt.toLocaleDateString('nl-BE') : 'nog niet'}
                </p>
              </div>

              <div className="button-row client-card-actions">
                <button type="button" className="secondary-button" onClick={() => startEdit(client)}>
                  ✎ Bewerk
                </button>
                <button type="button" className="danger-button" onClick={() => void handleDelete(client)}>
                  Verwijder
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}
