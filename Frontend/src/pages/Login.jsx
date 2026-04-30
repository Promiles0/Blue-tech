import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPass, setShowPass]     = useState(false)
  const [error, setError]           = useState('')
  const [loading, setLoading]       = useState(false)
  const { login }                   = useAuth()
  const navigate                    = useNavigate()
  const location                    = useLocation()
  const from                        = location.state?.from ?? '/'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(err.response?.data?.message ?? 'Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px' }}>
      <div className="fade-in" style={{ width: '100%', maxWidth: 400 }}>

        {/* Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 44 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c5cf0', display: 'block' }} />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '0.12em', color: '#fff' }}>NOIR</span>
        </Link>

        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#7c5cf0', marginBottom: 8 }}>WELCOME BACK</p>
        <h1 style={{ fontSize: 34, fontWeight: 900, color: '#fff', marginBottom: 36, letterSpacing: '-0.02em' }}>Sign in</h1>

        {error && (
          <div style={{
            background: 'var(--error-dim)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, padding: '12px 16px', fontSize: 13,
            color: '#f87171', marginBottom: 20,
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Field label="Email">
            <input
              type="email" value={email} required
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="noir-input"
            />
          </Field>

          <Field label="Password" style={{ marginBottom: 28 }}>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'} value={password} required
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="noir-input"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button" onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', display: 'flex', padding: 4 }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          <button type="submit" disabled={loading} className="noir-btn-primary" style={{ width: '100%', padding: '13px', fontSize: 15 }}>
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#888' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#7c5cf0', fontWeight: 500 }}
            onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
            onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  )
}

function Field({ label, children, style }) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#888', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}
