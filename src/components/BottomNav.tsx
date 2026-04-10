export type TabId = 'today' | 'week' | 'clients' | 'settings'

type BottomNavProps = {
  activeTab: TabId
  onSelect: (tab: TabId) => void
}

const TABS: Array<{ id: TabId; label: string; icon: string }> = [
  { id: 'today', label: 'Vandaag', icon: '◉' },
  { id: 'week', label: 'Week', icon: '▦' },
  { id: 'clients', label: 'Klanten', icon: '♟' },
  { id: 'settings', label: 'Meer', icon: '⚙' },
]

export function BottomNav({ activeTab, onSelect }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="Hoofdnavigatie">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          className={`bottom-nav-button${activeTab === tab.id ? ' is-active' : ''}`}
          onClick={() => onSelect(tab.id)}
        >
          <span className="bottom-nav-icon" aria-hidden="true">
            {tab.icon}
          </span>
          <span>{tab.label}</span>
        </button>
      ))}
    </nav>
  )
}
