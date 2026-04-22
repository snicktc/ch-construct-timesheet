import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './ErrorBoundary'
import { setServiceWorkerRegistration } from './utils/appUpdate'
import { migrateLegacyTimesheetData } from './utils/migration'

function renderApp() {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
}

async function bootstrap() {
  try {
    await migrateLegacyTimesheetData()
  } catch (error) {
    console.error('Legacy data migration failed during bootstrap', error)
  }

  registerSW({
    immediate: true,
    onRegisteredSW(_swUrl, registration) {
      setServiceWorkerRegistration(registration)
    },
  })

  renderApp()
}

void bootstrap()
