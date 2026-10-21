import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerPwa } from './lib/pwa'
import { installErrorReporter } from './lib/errorReporter'
import ErrorBoundary from './components/ErrorBoundary'
import { initialLang, loadDict } from './lib/i18n'

installErrorReporter()
registerPwa()

// Fetch the visitor's language first so Kinyarwanda/French pages never flash English.
loadDict(initialLang()).finally(() => createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
))
