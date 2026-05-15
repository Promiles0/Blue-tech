import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import GoogleLogin from '../components/GoogleLogin'
import PasswordStrength, { isFair } from '../components/site/PasswordStrength'

export default function Register() {
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm]   = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const { register }            = useAuth()
  const navigate                = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm)   { setError('Passwords do not match.');           return }
    if (password.length < 8)    { setError('Password must be at least 8 characters.'); return }
    if (!isFair(password))      { setError('Password is too weak. Add uppercase letters, numbers or symbols.'); return }
    setError('')
    setLoading(true)
    try {
      await register(name, email, password)
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message ?? 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: 'calc(100vh - 60px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Ambient purple glow */}
      <div style={{
        position: 'absolute', top: '10%', left: '50%',
        transform: 'translateX(-50%)',
        width: 700, height: 700, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,92,240,0.13) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '5%', left: '15%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,92,240,0.07) 0%, transparent 65%)',
        pointerEvents: 'none',
      }} />

      {/* Frosted glass card */}
      <div className="auth-card fade-in" style={{
        width: '100%', maxWidth: 480,
        background: 'rgba(255, 255, 255, 0.04)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 20,
        padding: 40,
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.4)',
        position: 'relative', zIndex: 1,
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 40 }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c5cf0', display: 'block' }} />
          <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '0.12em', color: '#fff' }}>NOIR</span>
        </Link>

        <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#7c5cf0', marginBottom: 8, textTransform: 'uppercase' }}>Get started</p>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#fff', marginBottom: 32, letterSpacing: '-0.02em' }}>Create account</h1>

        {error && (
          <div style={{ background: 'var(--error-dim)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '11px 14px', fontSize: 13, color: '#f87171', marginBottom: 20 }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Field label="Full name">
            <input type="text" value={name} required onChange={e => setName(e.target.value)}
              placeholder="Jane Doe" className="noir-input auth-input" />
          </Field>
          <Field label="Email">
            <input type="email" value={email} required onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" className="noir-input auth-input" />
          </Field>
          <Field label="Password">
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} value={password} required
                onChange={e => setPassword(e.target.value)}
                placeholder="Min. 8 characters" className="noir-input auth-input" style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPass(p => !p)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#888', display: 'flex', padding: 4 }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </Field>
          <Field label="Confirm password" style={{ marginBottom: 28 }}>
            <input type={showPass ? 'text' : 'password'} value={confirm} required
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repeat password" className="noir-input auth-input" />
          </Field>

          <button type="submit" disabled={loading} className="noir-btn-primary auth-submit-btn" style={{ width: '100%', padding: '13px', fontSize: 15 }}>
            {loading ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <GoogleLogin />
        </div>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#888' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#7c5cf0', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>

      <style>{`
        .auth-input { min-height: 48px !important; border-radius: 10px !important; }
        .auth-input:focus { box-shadow: 0 0 0 3px rgba(124,92,240,0.18) !important; }
        .auth-submit-btn { border-radius: 10px !important; transition: background 0.2s, transform 0.15s, box-shadow 0.15s !important; }
        .auth-submit-btn:hover:not(:disabled) { transform: translateY(-2px) !important; box-shadow: 0 8px 24px rgba(124,92,240,0.35) !important; }
        @media (max-width: 480px) {
          .auth-card { padding: 28px 20px !important; }
        }
      `}</style>
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
