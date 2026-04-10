import { useMemo, useState } from 'react'

import type { Client } from '../db/database'

type ClientSelectProps = {
  clients: Client[]
  value: number | null
  onChange: (clientId: number) => void
  onCreateNew: () => void
}

export function ClientSelect({ clients, value, onChange, onCreateNew }: ClientSelectProps) {
  const [query, setQuery] = useState(() => clients.find((client) => client.id === value)?.name ?? '')

  const filteredClients = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return clients.slice(0, 6)
    }

    return clients
      .filter((client) => client.name.toLowerCase().includes(normalizedQuery))
      .slice(0, 6)
  }, [clients, query])

  const resolveClientByQuery = () => {
    const exactMatch = clients.find((client) => client.name.toLowerCase() === query.trim().toLowerCase())

    if (exactMatch?.id) {
      onChange(exactMatch.id)
    }
  }

  return (
    <div className="client-select-row">
      <input
        className="select-input"
        list="client-options"
        value={query}
        placeholder="Zoek klant"
        onChange={(event) => setQuery(event.target.value)}
        onBlur={resolveClientByQuery}
      />
      <datalist id="client-options">
        {clients.map((client) => (
          <option key={client.id} value={client.name} />
        ))}
      </datalist>
      <div className="autocomplete-list">
        {filteredClients.map((client) => (
          <button
            key={client.id}
            type="button"
            className={`autocomplete-item${client.id === value ? ' is-active' : ''}`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setQuery(client.name)
              if (client.id) {
                onChange(client.id)
              }
            }}
          >
            <span>{client.name}</span>
            <span className="muted-text">{client.defaultLocation}</span>
          </button>
        ))}
        <button type="button" className="autocomplete-item create-new" onMouseDown={(event) => event.preventDefault()} onClick={onCreateNew}>
          + Nieuwe klant
        </button>
      </div>
    </div>
  )
}
