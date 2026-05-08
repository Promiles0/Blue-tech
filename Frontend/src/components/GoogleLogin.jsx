import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

/**
 * GoogleLogin Component
 */
const GoogleLogin = () => {
  const { googleLogin } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  // ... (debug useEffect remains same)

  useEffect(() => {
    const initializeGoogleSignIn = () => {
      // ... (checks remain same)

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
            navigate('/', { replace: true })
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
