import { useEffect, useState } from 'react'

import './App.css'
import { BottomNav, type TabId } from './components/BottomNav'
import { Toast } from './components/Toast'
import { TodayPage } from './pages/TodayPage'
import { ClientsPage } from './pages/ClientsPage'
import { SettingsPage } from './pages/SettingsPage'
import { WeekPage } from './pages/WeekPage'
import { useActiveProfile } from './hooks/useActiveProfile'
import { useProfiles } from './hooks/useProfiles'
import { runNotificationChecks } from './utils/notifications'

function App() {
  const { profiles, activeProfiles, loading, createProfile } = useProfiles()
  const { activeEmployee, activeEmployeeId, setActiveEmployeeId } = useActiveProfile()
  const [activeTab, setActiveTab] = useState<TabId>('today')
  const [name, setName] = useState('')
  const [exportRecipient, setExportRecipient] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [selectedDayFromWeek, setSelectedDayFromWeek] = useState<Date | null>(null)
  const [highlightRepeatCard, setHighlightRepeatCard] = useState(false)
  const [highlightExportPrompt, setHighlightExportPrompt] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tabParam = params.get('tab')
    const repeatReady = params.get('repeatReady') === '1'
    const exportPrompt = params.get('exportPrompt') === '1'

    if (tabParam === 'today' || tabParam === 'week' || tabParam === 'clients' || tabParam === 'settings') {
      setActiveTab(tabParam)
    }

    setHighlightRepeatCard(repeatReady)
    setHighlightExportPrompt(exportPrompt)

    if (tabParam || repeatReady || exportPrompt) {
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  useEffect(() => {
    void runNotificationChecks(activeEmployeeId)
  }, [activeEmployeeId])

  const handleCreateFirstProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!name.trim() || !exportRecipient.trim()) {
      setErrorMessage('Naam en bestemmeling zijn verplicht.')
      return
    }

    try {
      setIsSaving(true)
      setErrorMessage('')
      await createProfile({
        name,
        exportRecipient,
      })
      setName('')
      setExportRecipient('')
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Profiel opslaan mislukt.')
    } finally {
      setIsSaving(false)
    }
  }

  const showWelcome = !loading && profiles.length === 0

  return (
    <main className="app-shell">
      <div className="app-container">
        {showWelcome ? (
          <>
            <header className="app-header">
              <h1>timesheet</h1>
              <p>Maak een eerste profiel aan om de app te starten.</p>
            </header>

            <section className="panel">
              <h2>Welkom</h2>
              <p className="muted-text">Naam en bestemmeling volstaan om te beginnen.</p>

              <form className="welcome-form" onSubmit={handleCreateFirstProfile}>
                <div className="field">
                  <label htmlFor="profile-name">Naam</label>
                  <input
                    id="profile-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Milan"
                  />
                </div>

                <div className="field">
                  <label htmlFor="profile-export-recipient">Export naar</label>
                  <input
                    id="profile-export-recipient"
                    value={exportRecipient}
                    onChange={(event) => setExportRecipient(event.target.value)}
                    placeholder="CH Construct"
                  />
                </div>

                {errorMessage ? <Toast message={errorMessage} tone="error" /> : null}

                <button className="primary-button" type="submit" disabled={isSaving}>
                  {isSaving ? 'Opslaan...' : 'Start'}
                </button>
              </form>
            </section>
          </>
        ) : null}

        {!showWelcome && activeEmployee && activeEmployeeId ? (
          <>
            {activeTab === 'today' ? (
              <TodayPage
                key={selectedDayFromWeek ? selectedDayFromWeek.toISOString() : 'today-page'}
                activeEmployee={activeEmployee}
                activeEmployeeId={activeEmployeeId}
                activeProfiles={activeProfiles}
                onSelectEmployee={setActiveEmployeeId}
                initialDate={selectedDayFromWeek ?? undefined}
                onDateConsumed={() => setSelectedDayFromWeek(null)}
                highlightRepeatCard={highlightRepeatCard}
              />
            ) : activeTab === 'week' ? (
              <WeekPage
                activeEmployee={activeEmployee}
                activeEmployeeId={activeEmployeeId}
                activeProfiles={activeProfiles}
                onSelectEmployee={setActiveEmployeeId}
                onOpenDay={(date) => {
                  setSelectedDayFromWeek(date)
                  setActiveTab('today')
                }}
                highlightExportPrompt={highlightExportPrompt}
              />
            ) : activeTab === 'clients' ? (
              <ClientsPage
                activeEmployeeId={activeEmployeeId}
                activeProfiles={activeProfiles}
                onSelectEmployee={setActiveEmployeeId}
              />
            ) : (
              <SettingsPage
                activeEmployeeId={activeEmployeeId}
                activeProfiles={activeProfiles}
                onSelectEmployee={setActiveEmployeeId}
              />
            )}

            <BottomNav activeTab={activeTab} onSelect={setActiveTab} />
          </>
        ) : null}
      </div>
    </main>
  )
}

export default App
