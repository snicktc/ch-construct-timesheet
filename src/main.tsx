import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'
import { migrateLegacyTimesheetData } from './utils/migration'

async function bootstrap() {
  await migrateLegacyTimesheetData()

  registerSW({
    immediate: true,
  })

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
