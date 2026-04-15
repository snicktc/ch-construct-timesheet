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
  const [openedFromWeek, setOpenedFromWeek] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')

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
  const showMissingActiveProfile = !loading && profiles.length > 0 && (!activeEmployee || !activeEmployeeId)

  return (
    <main className="app-shell">
      <div className="app-container">
        {loading ? <section className="panel muted-text">Laden...</section> : null}

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
                  <select
                    id="profile-export-recipient"
                    value={exportRecipient}
                    onChange={(event) => setExportRecipient(event.target.value)}
                  >
                    <option value="" disabled>
                      Kies een bestemmeling
                    </option>
                    <option value="CH Construct">CH Construct</option>
                    <option value="VBW">VBW</option>
                  </select>
                </div>

                {errorMessage ? <Toast message={errorMessage} tone="error" /> : null}

                <button className="primary-button" type="submit" disabled={isSaving}>
                  {isSaving ? 'Opslaan...' : 'Start'}
                </button>
              </form>
            </section>
          </>
        ) : null}

        {showMissingActiveProfile && activeTab !== 'settings' ? (
          <>
            <header className="app-header">
              <h1>timesheet</h1>
              <p>Er is profieldata gevonden, maar er kon geen actief profiel geladen worden.</p>
            </header>

            <section className="panel">
              <h2>Profiel herstellen</h2>
              <p className="muted-text">
                Kies een profiel om verder te gaan of open `Meer` om je profielen te beheren.
              </p>

              <div className="profile-list" role="tablist" aria-label="Beschikbare profielen">
                {activeProfiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    className="profile-chip"
                    onClick={() => {
                      const debugMsg = `DEBUG: Klik op profiel\nID: ${profile.id}\nNaam: ${profile.name}\nActiveProfiles count: ${activeProfiles.length}\nCurrent activeEmployeeId: ${activeEmployeeId}`
                      setDebugInfo(debugMsg)
                      
                      if (profile.id) {
                        setActiveEmployeeId(profile.id)
                      } else {
                        setDebugInfo(prev => prev + '\n\nERROR: profile.id is undefined!')
                      }
                    }}
                  >
                    {profile.name} · {profile.exportRecipient}
                  </button>
                ))}
              </div>
              
              {debugInfo ? (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '12px', 
                  background: '#fff3cd', 
                  border: '1px solid #ffc107',
                  borderRadius: '8px',
                  fontSize: '12px',
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace'
                }}>
                  {debugInfo}
                </div>
              ) : null}

              <div className="button-row top-gap">
                <button type="button" className="secondary-button" onClick={() => setActiveTab('settings')}>
                  Open Meer
                </button>
              </div>
            </section>
          </>
        ) : null}

        {!showWelcome && (activeTab === 'settings' || (!showMissingActiveProfile && activeEmployee && activeEmployeeId)) ? (
          <>
            {activeTab === 'today' && activeEmployee && activeEmployeeId ? (
              <TodayPage
                activeEmployee={activeEmployee}
                activeEmployeeId={activeEmployeeId}
                activeProfiles={activeProfiles}
                onSelectEmployee={setActiveEmployeeId}
                initialDate={selectedDayFromWeek ?? undefined}
                onDateConsumed={() => {
                  setSelectedDayFromWeek(null)
                  setOpenedFromWeek(false)
                }}
                highlightRepeatCard={highlightRepeatCard}
                openedFromWeek={openedFromWeek}
              />
            ) : activeTab === 'week' && activeEmployee && activeEmployeeId ? (
              <WeekPage
                activeEmployee={activeEmployee}
                activeEmployeeId={activeEmployeeId}
                activeProfiles={activeProfiles}
                onSelectEmployee={setActiveEmployeeId}
                onOpenDay={(date) => {
                  setSelectedDayFromWeek(date)
                  setOpenedFromWeek(true)
                  setActiveTab('today')
                }}
                highlightExportPrompt={highlightExportPrompt}
              />
            ) : activeTab === 'clients' && activeEmployeeId ? (
              <ClientsPage
                activeEmployeeId={activeEmployeeId}
                activeProfiles={activeProfiles}
                onSelectEmployee={setActiveEmployeeId}
              />
            ) : (
              <SettingsPage
                activeEmployeeId={activeEmployeeId ?? profiles[0]?.id ?? 0}
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
