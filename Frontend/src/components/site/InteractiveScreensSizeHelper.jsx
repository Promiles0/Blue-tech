import { useState } from 'react'
import { ArrowRight, GraduationCap, Users, Presentation, Building2, Minus, Plus } from 'lucide-react'
import { Reveal } from '../../lib/motion'
import { CONFIGS } from './InteractiveScreensConfigurations'
import { openQuote } from '../../lib/quote'

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent-light, var(--accent))', marginBottom: 8 }
const heading = { fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(24px,3vw,32px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }

const ROOMS = [
  { id: 'classroom', label: 'Classroom',    Icon: GraduationCap, use: 'classroom', people: 35 },
  { id: 'meeting',   label: 'Meeting room', Icon: Users,         use: 'office',    people: 8 },
  { id: 'lecture',   label: 'Lecture hall', Icon: Presentation,  use: 'classroom', people: 70 },
  { id: 'boardroom', label: 'Boardroom',    Icon: Building2,     use: 'office',    people: 18 },
]

// Smallest size whose "Up to N people" covers the audience; the largest one otherwise.
function recommend(people) {
  return CONFIGS.find((c) => Number(c.seats.match(/\d+/)?.[0]) >= people) ?? CONFIGS[CONFIGS.length - 1]
}

export default function InteractiveScreensSizeHelper() {
  const [room, setRoom] = useState(ROOMS[0])
  const [people, setPeople] = useState(ROOMS[0].people)
  const [rooms, setRooms] = useState(1)
  const pick = recommend(people)

  const chooseRoom = (r) => { setRoom(r); setPeople(r.people) }
  const getQuote = () => openQuote({
    screenSize: pick.size,
    quantity: rooms,
    intendedUse: room.use,
    notes: `Size helper: ${rooms} × ${room.label.toLowerCase()}, about ${people} people per room.`,
  })

  return (
    <section style={{ padding: 'clamp(56px,8vw,100px) 0' }}>
      <div className="container-noir">
        <Reveal>
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <p style={eyebrow}>Not sure which size?</p>
            <h2 style={heading}>Tell us about the room.</h2>
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <div className="ish-card">
            <div className="ish-inputs">
              <p className="ish-label">Room type</p>
              <div className="ish-rooms" role="radiogroup" aria-label="Room type">
                {ROOMS.map((r) => (
                  <button key={r.id} role="radio" aria-checked={room.id === r.id}
                    className={`ish-room ${room.id === r.id ? 'on' : ''}`} onClick={() => chooseRoom(r)}>
                    <r.Icon size={18} /> {r.label}
                  </button>
                ))}
              </div>

              <label className="ish-label" htmlFor="ish-people" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26 }}>
                <span>People in the room</span><strong style={{ color: 'var(--text)' }}>{people}</strong>
              </label>
              <input id="ish-people" type="range" min={4} max={150} value={people}
                onChange={(e) => setPeople(Number(e.target.value))} className="ish-range" />

              <p className="ish-label" style={{ marginTop: 26 }}>How many rooms?</p>
              <div className="ish-stepper">
                <button onClick={() => setRooms((n) => Math.max(1, n - 1))} aria-label="Fewer rooms"><Minus size={15} /></button>
                <span>{rooms}</span>
                <button onClick={() => setRooms((n) => Math.min(200, n + 1))} aria-label="More rooms"><Plus size={15} /></button>
              </div>
            </div>

            <div className="ish-result" aria-live="polite">
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', opacity: 0.75 }}>We'd recommend</p>
              <p className="ish-size">{pick.size}</p>
              <p style={{ fontSize: 14, opacity: 0.85 }}>{pick.seats} · {pick.dims}</p>
              <p style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>Typical for: {pick.room.toLowerCase()}</p>
              <button onClick={getQuote} className="ish-cta">
                Get a quote for {rooms > 1 ? `${rooms} × ` : ''}{pick.size} <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </Reveal>
      </div>

      <style>{`
        .ish-card{display:grid;grid-template-columns:1.3fr 1fr;border:1px solid var(--border);border-radius:24px;overflow:hidden;background:var(--surface);max-width:980px;margin:0 auto}
        .ish-inputs{padding:clamp(22px,4vw,40px)}
        .ish-label{font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin-bottom:12px}
        .ish-rooms{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}
        .ish-room{display:flex;align-items:center;gap:9px;padding:12px 14px;border-radius:14px;border:1px solid var(--border);background:transparent;color:var(--text);font-size:14px;font-weight:600;cursor:pointer;transition:border-color .15s,background .15s}
        .ish-room:hover{border-color:var(--accent)}
        .ish-room.on{border-color:var(--accent);background:var(--accent-dim)}
        .ish-range{width:100%;accent-color:var(--accent);cursor:pointer}
        .ish-stepper{display:inline-flex;align-items:center;border:1px solid var(--border);border-radius:12px;overflow:hidden}
        .ish-stepper button{width:40px;height:40px;border:0;background:transparent;color:var(--text);cursor:pointer;display:flex;align-items:center;justify-content:center}
        .ish-stepper button:hover{background:var(--accent-dim)}
        .ish-stepper span{min-width:44px;text-align:center;font-weight:700}
        .ish-result{display:flex;flex-direction:column;justify-content:center;gap:6px;padding:clamp(22px,4vw,40px);color:#fff;
          background:linear-gradient(150deg,#12142a 0%,#22284a 55%,#354380 100%)}
        .ish-size{font-family:"Space Grotesk",sans-serif;font-size:clamp(56px,8vw,84px);font-weight:900;letter-spacing:-.03em;line-height:1}
        .ish-cta{margin-top:18px;align-self:flex-start;display:inline-flex;align-items:center;gap:8px;padding:13px 22px;border-radius:999px;border:0;cursor:pointer;
          background:#f59e0b;color:#241a06;font-size:14px;font-weight:700;box-shadow:0 14px 30px rgba(245,158,11,.3)}
        @media (max-width:760px){.ish-card{grid-template-columns:1fr}}
      `}</style>
    </section>
  )
}
