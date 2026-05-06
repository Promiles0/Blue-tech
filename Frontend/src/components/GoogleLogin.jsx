import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

/**
 * GoogleLogin Component
 *
 * This component integrates Google Sign-In into the React app.
 * It initializes the Google Identity Services with the provided Client ID,
 * renders the Google Sign-In button, and handles the authentication callback.
 *
 * Make sure the exact origin shown by window.location.origin is authorized in
 * your Google Cloud Console under Authorized JavaScript origins.
 * Example: http://localhost:5173
 */
const GoogleLogin = () => {
  const { googleLogin } = useAuth()
  const [error, setError] = useState('')

  // Debug: Log the exact origin being used
  useEffect(() => {
    console.log('🔐 Google Sign-In Debug Info:')
    console.log('Client ID:', CLIENT_ID)
    console.log('Current Origin:', window.location.origin)
    console.log('Full URL:', window.location.href)
    console.log('⚠️  Make sure your Google Cloud Console has this EXACT origin in "Authorized JavaScript origins"')
  }, [])

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      if (!CLIENT_ID) {
        setError('Missing VITE_GOOGLE_CLIENT_ID. Add it to your frontend environment before using Google Sign-In.')
        return
      }

      if (!window.google?.accounts?.id) {
        setError('Google Identity Services did not load. Please refresh the page.')
        return
      }

      window.google.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: async (response) => {
          setError('')
          if (!response?.credential) {
            setError('Google did not return a credential token.')
            return
          }

          try {
            await googleLogin(response.credential)
          } catch (err) {
            console.error('Google login failed:', err)
            const message = err.response?.data?.message || 'Google login failed. Please try again.'
            setError(message)
          }
        },
      })

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'rectangular',
        }
      )
    }

    if (window.google?.accounts?.id) {
      initializeGoogleSignIn()
      return
    }

    const existingScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
    if (existingScript) {
      existingScript.addEventListener('load', initializeGoogleSignIn, { once: true })
      existingScript.addEventListener('error', () => setError('Failed to load Google Sign-In script.'), { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = initializeGoogleSignIn
    script.onerror = () => setError('Failed to load Google Sign-In script.')
    document.body.appendChild(script)

    return () => {
      const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]')
      existing?.removeEventListener('load', initializeGoogleSignIn)
    }
  }, [googleLogin])

  return (
    <div>
      {error && (
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: 'red', fontSize: '14px', marginBottom: '8px' }}>❌ {error}</p>
          {error.includes('403') && (
            <p style={{ color: '#ff9800', fontSize: '12px', marginTop: '8px', padding: '8px', backgroundColor: '#fff3e0', borderRadius: '4px' }}>
              <strong>Debug Info:</strong> Your origin is <code>{window.location.origin}</code>. 
              Make sure this exact value is in your Google Cloud Console under "Authorized JavaScript origins".
            </p>
          )}
        </div>
      )}
      <div id="google-signin-button"></div>
    </div>
  )
}

export default GoogleLogin
