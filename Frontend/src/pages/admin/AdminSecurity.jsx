import { useEffect, useState } from 'react'
import { Copy, Download, KeyRound, ShieldCheck, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import QRCode from 'qrcode'
import apiService from '../../api/service'
import { useAuth } from '../../context/AuthContext'

// Two-step login (8e): set up an authenticator app (Google Authenticator, Microsoft
// Authenticator, Authy…), keep backup codes, and — for admins — require it for all staff.
// The QR code is drawn here in the browser; the secret never goes to any outside service.
const card = { borderRadius: 14, padding: '22px 24px', marginBottom: 18, maxWidth: 680 }
const btn = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 9, border: 0, background: 'var(--admin-primary)', color: '#fff', fontWeight: 700, fontSize: 13.5, cursor: 'pointer' }
const ghost = { ...btn, background: 'transparent', color: 'var(--text)', border: '1px solid var(--admin-border)' }
const codeInput = { width: 150, padding: '10px 12px', borderRadius: 9, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--text)', fontSize: 18, letterSpacing: '0.3em', textAlign: 'center' }

function saveSession(data, updateUser) {
  if (!data?.token) return
  localStorage.setItem('token', data.token)
  if (data.user) updateUser(data.user)
}

function BackupCodes({ codes }) {
  const text = codes.join('\n')
  return (
    <div style={{ marginTop: 14, padding: 16, borderRadius: 12, border: '1px dashed var(--admin-warning, #f59e0b)' }}>
      <p style={{ fontSize: 13.5, fontWeight: 700, margin: '0 0 6px' }}>Save these backup codes now</p>
      <p style={{ fontSize: 12.5, color: 'var(--admin-muted)', margin: '0 0 12px', lineHeight: 1.6 }}>
        Each one signs you in once if you lose your phone. They won't be shown again. Keep them somewhere safe (not on the same phone).
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, max-content)', gap: '6px 28px', fontFamily: 'ui-monospace, monospace', fontSize: 15, marginBottom: 12 }}>
        {codes.map((c) => <span key={c}>{c}</span>)}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button style={ghost} onClick={() => navigator.clipboard?.writeText(text).then(() => toast.success('Copied'))}><Copy size={14} /> Copy</button>
        <button style={ghost} onClick={() => {
          const url = URL.createObjectURL(new Blob([`Blue-Tech backup codes\n\n${text}\n`], { type: 'text/plain' }))
          Object.assign(document.createElement('a'), { href: url, download: 'blue-tech-backup-codes.txt' }).click()
          URL.revokeObjectURL(url)
        }}><Download size={14} /> Download</button>
      </div>
    </div>
  )
}

export default function AdminSecurity() {
  const { user, isAdmin, updateUser } = useAuth()
  const [status, setStatus] = useState(null)
  const [setup, setSetup] = useState(null) // { secret, qr }
  const [code, setCode] = useState('')
  const [codes, setCodes] = useState(null)
  const [busy, setBusy] = useState(false)
  const required = new URLSearchParams(window.location.search).get('required') === '1'

  const load = () => apiService.auth.mfa.status().then(({ data }) => setStatus(data)).catch(() => toast.error('Could not load'))
  useEffect(() => { load() }, [])

  const start = async () => {
    setBusy(true)
    try {
      const { data } = await apiService.auth.mfa.setup()
      setSetup({ secret: data.secret, qr: await QRCode.toDataURL(data.otpauthUrl, { margin: 1, width: 220 }) })
    } catch (e) { toast.error(e.response?.data?.message ?? 'Could not start') } finally { setBusy(false) }
  }

  const enable = async () => {
    setBusy(true)
    try {
      const { data } = await apiService.auth.mfa.enable(code)
      saveSession(data, updateUser)
      setCodes(data.recoveryCodes); setSetup(null); setCode('')
      toast.success('Two-step login is on')
      load()
    } catch (e) { toast.error(e.response?.data?.message ?? 'Could not turn it on') } finally { setBusy(false) }
  }

  const disable = async () => {
    setBusy(true)
    try {
      const { data } = await apiService.auth.mfa.disable(code)
      saveSession(data, updateUser)
      setCode(''); setCodes(null); toast.success('Two-step login is off'); load()
    } catch (e) { toast.error(e.response?.data?.message ?? 'Could not turn it off') } finally { setBusy(false) }
  }

  const newCodes = async () => {
    setBusy(true)
    try { const { data } = await apiService.auth.mfa.backupCodes(code); setCodes(data.recoveryCodes); setCode(''); load() }
    catch (e) { toast.error(e.response?.data?.message ?? 'Could not create new codes') } finally { setBusy(false) }
  }

  const setRequired = async (on) => {
    try {
      const { data } = await apiService.admin.settings.saveSecurity({ requireMfaForStaff: on })
      toast.success(on ? 'Two-step login is now required for admin and staff' : 'No longer required')
      if (on && data?.notYetSetUp?.length) toast.message(`Still to set up (asked at their next visit): ${data.notYetSetUp.join(', ')}`)
      load()
    } catch (e) { toast.error(e.response?.data?.message ?? 'Could not save') }
  }

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
        <ShieldCheck size={22} style={{ color: 'var(--admin-primary)' }} /> Two-step login
      </h1>
      <p style={{ color: 'var(--admin-muted)', fontSize: 13, margin: '4px 0 20px', maxWidth: 680, lineHeight: 1.6 }}>
        After your password (or Google), you also enter a 6-digit code from an app on your phone — so a leaked password alone can't open the admin panel.
      </p>
      {required && status && !status.enabled && (
        <div style={{ ...card, border: '1px solid var(--admin-warning)', background: 'rgba(245,158,11,.07)', display: 'flex', gap: 10 }}>
          <ShieldAlert size={18} style={{ color: 'var(--admin-warning)', flexShrink: 0 }} />
          <span style={{ fontSize: 13.5 }}>Your shop requires two-step login for admin and staff. Set it up below to continue.</span>
        </div>
      )}

      <div className="surface" style={card}>
        {!status ? <p style={{ fontSize: 13, color: 'var(--admin-muted)', margin: 0 }}>Loading…</p>
          : status.enabled ? (
            <>
              <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 4px', color: 'var(--admin-success, #22c55e)' }}>✓ On for {user?.email}</p>
              <p style={{ fontSize: 13, color: 'var(--admin-muted)', margin: '0 0 16px' }}>{status.backupCodesLeft} backup code{status.backupCodesLeft === 1 ? '' : 's'} left.</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" inputMode="numeric" style={codeInput} />
                <button style={ghost} disabled={busy || code.length !== 6} onClick={newCodes}><KeyRound size={14} /> New backup codes</button>
                {!status.required && <button style={ghost} disabled={busy || code.length !== 6} onClick={disable}>Turn off</button>}
              </div>
              <p style={{ fontSize: 12, color: 'var(--admin-muted)', margin: '8px 0 0' }}>Enter a current code from your app to make either change.</p>
            </>
          ) : setup ? (
            <>
              <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px' }}>1. Scan this with your authenticator app</p>
              <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                <img src={setup.qr} alt="QR code for your authenticator app" width={180} height={180} style={{ borderRadius: 10, background: '#fff', padding: 6 }} />
                <div style={{ fontSize: 12.5, color: 'var(--admin-muted)', lineHeight: 1.6, maxWidth: 300 }}>
                  Use Google Authenticator, Microsoft Authenticator or Authy. Can't scan? Enter this key instead:
                  <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: 'var(--text)', wordBreak: 'break-all', marginTop: 6 }}>{setup.secret.replace(/(.{4})/g, '$1 ').trim()}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, fontWeight: 700, margin: '0 0 10px' }}>2. Enter the 6-digit code it shows</p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" inputMode="numeric" autoFocus style={codeInput} />
                <button style={btn} disabled={busy || code.length !== 6} onClick={enable}>Turn on</button>
              </div>
            </>
          ) : (
            <>
              <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 12px' }}>Off for {user?.email}</p>
              <button style={btn} onClick={start} disabled={busy}><ShieldCheck size={15} /> Set up two-step login</button>
            </>
          )}
        {codes && <BackupCodes codes={codes} />}
      </div>

      {isAdmin && status && (
        <div className="surface" style={card}>
          <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>Require it for admin and staff</h2>
          <p style={{ fontSize: 12.5, color: 'var(--admin-muted)', margin: '0 0 12px', lineHeight: 1.6 }}>
            Anyone with admin or staff access who hasn't set it up is sent here before they can use the admin panel.
            You can only turn this on once two-step login is on for your own account.
          </p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 600, opacity: status.enabled ? 1 : 0.5 }}>
            <input type="checkbox" checked={status.requireForStaff} disabled={!status.enabled} onChange={(e) => setRequired(e.target.checked)} />
            Require two-step login for admin and staff
          </label>
        </div>
      )}
    </div>
  )
}
