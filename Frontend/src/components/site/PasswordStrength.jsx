const LEVELS = [
  { label: 'Weak',  color: '#ef4444', min: 0  },
  { label: 'Fair',  color: '#f59e0b', min: 2  },
  { label: 'Good',  color: '#60a5fa', min: 3  },
  { label: 'Strong',color: '#34d399', min: 4  },
]

function score(pw) {
  if (!pw) return 0
  let s = 0
  if (pw.length >= 8)  s++
  if (pw.length >= 12) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^A-Za-z0-9]/.test(pw)) s++
  return Math.min(s, 4)
}

function getStrengthLevel(pw) {
  const s = score(pw)
  return [...LEVELS].reverse().find(l => s >= l.min) ?? LEVELS[0]
}

export default function PasswordStrength({ password }) {
  if (!password) return null
  const s     = score(password)
  const level = getStrengthLevel(password)

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
        {[1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              flex: 1, height: 3, borderRadius: 2,
              background: i <= s ? level.color : '#2a2a2a',
              transition: 'background 0.3s',
            }}
          />
        ))}
      </div>
      <p style={{ fontSize: 11, color: level.color, fontWeight: 600 }}>
        {level.label}
        {s < 2 && <span style={{ color: '#555', fontWeight: 400 }}> — add uppercase, numbers or symbols</span>}
      </p>
    </div>
  )
}
