import { Component } from 'react'
import { isChunkLoadError, reloadForNewVersion, reportError } from '../lib/errorReporter'

// Catches a crash anywhere below it: the customer gets a friendly screen with a reload
// button instead of a blank site, and the team gets the error on Admin → Site errors.
export default class ErrorBoundary extends Component {
  state = { error: null }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    if (isChunkLoadError(error) && reloadForNewVersion()) return
    reportError(error, { componentStack: info?.componentStack })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: 'var(--bg, #0b0d14)', color: 'var(--text, #f5f5f5)', fontFamily: 'inherit' }}>
        <div style={{ maxWidth: 420, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, margin: '0 auto 18px', background: '#354380', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800 }}>B</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>Something went wrong</h1>
          <p style={{ fontSize: 14, lineHeight: 1.6, opacity: 0.75, margin: '0 0 20px' }}>
            Sorry — this page hit a problem. Our team has been told automatically. Reloading usually fixes it.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button type="button" onClick={() => window.location.reload()} style={{ padding: '10px 18px', borderRadius: 10, border: 0, background: '#354380', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Reload page</button>
            <a href="/" style={{ padding: '10px 18px', borderRadius: 10, border: '1px solid rgba(127,127,127,.35)', color: 'inherit', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}>Go to home page</a>
          </div>
        </div>
      </div>
    )
  }
}
