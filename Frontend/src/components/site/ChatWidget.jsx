import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { Sparkles, X, ArrowUp, RotateCcw, MessageCircle, Mail, FileText } from 'lucide-react'
import apiService from '../../api/service'
import { useCurrency } from '../../context/CurrencyContext'
import { onLiveChatOpen } from '../../lib/liveChat'
import { SUPPORT_EMAIL, WHATSAPP_NUMBER } from '../../lib/helpLinks'

// Blue — the storefront's AI shopping assistant. Answers come from POST /chat (Gemini,
// grounded in the published catalogue); the conversation lives in sessionStorage so it
// survives page navigation but not a new visit.
const STORAGE_KEY = 'bluechat-v1'
// Anonymous per-tab id so Admin → Blue can group turns into conversations.
const SESSION_KEY = 'bluechat-session'
function chatSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) { id = crypto.randomUUID?.() ?? String(Date.now()) + Math.random().toString(16).slice(2); sessionStorage.setItem(SESSION_KEY, id) }
    return id
  } catch { return 'anonymous' }
}
const HIDDEN_ON = ['/checkout', '/login', '/register']
const SUGGESTIONS = [
  'Best laptop for a student under 600,000 RWF?',
  'I need a smart screen for a classroom',
  'Compare your gaming laptops',
  'How do delivery and returns work?',
]
const GREETING = {
  role: 'assistant',
  text: "Hi, I'm Blue 👋 Tell me what you'll use it for and your budget, and I'll find the right machine. I can also answer questions about delivery, warranty and returns.",
}

function loadHistory() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')
    return Array.isArray(saved) && saved.length ? saved : [GREETING]
  } catch { return [GREETING] }
}

// Minimal formatting: **bold** and "- " bullet lines. Everything else stays plain text.
function RichText({ text }) {
  const lines = text.split('\n')
  return lines.map((line, i) => {
    const bullet = /^\s*[-*•]\s+/.test(line)
    const content = line.replace(/^\s*[-*•]\s+/, '').split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
      part.startsWith('**') && part.endsWith('**') ? <strong key={j}>{part.slice(2, -2)}</strong> : part)
    return (
      <div key={i} style={{ display: 'flex', gap: 6, minHeight: line.trim() ? undefined : 8 }}>
        {bullet && <span style={{ color: 'var(--accent-light, var(--accent))' }}>•</span>}
        <span>{content}</span>
      </div>
    )
  })
}

function ProductChip({ product, onNavigate }) {
  const { formatPrice } = useCurrency()
  return (
    <Link to={`/products/${product.productId}`} onClick={onNavigate} className="bluechat-product">
      <div className="bluechat-product-img">
        {product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" /> : <Sparkles size={16} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="bluechat-product-name">{product.name}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--price, var(--accent))' }}>{formatPrice(product.price)}</div>
      </div>
    </Link>
  )
}

function Handoff({ kind, lastQuestion, onNavigate }) {
  if (kind === 'quote') {
    return (
      <div className="bluechat-actions">
        <Link to="/interactive-screens?quote=1" onClick={onNavigate} className="bluechat-action primary"><FileText size={13} /> Request a quote</Link>
      </div>
    )
  }
  const waText = encodeURIComponent(`Hi Blue-Tech! I was chatting with your assistant and need help with: ${lastQuestion ?? ''}`)
  return (
    <div className="bluechat-actions">
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`} target="_blank" rel="noreferrer" className="bluechat-action primary"><MessageCircle size={13} /> WhatsApp the team</a>
      <a href={`mailto:${SUPPORT_EMAIL}`} className="bluechat-action"><Mail size={13} /> Email us</a>
    </div>
  )
}

export default function ChatWidget() {
  const location = useLocation()
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(loadHistory)
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)

  // Latest send(), so an "ask this now" event never calls a stale closure.
  const sendRef = useRef(null)

  useEffect(() => onLiveChatOpen(({ prefill, send }) => {
    setOpen(true)
    if (prefill && send) setTimeout(() => sendRef.current?.(prefill), 0)
    else if (prefill) setInput(prefill)
  }), [])

  useEffect(() => {
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30))) } catch { /* non-fatal */ }
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: reduce ? 'auto' : 'smooth' })
  }, [messages, sending, reduce])

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 150) }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (HIDDEN_ON.some((p) => location.pathname.startsWith(p))) return null

  const send = async (raw) => {
    const text = (raw ?? input).trim()
    if (!text || sending) return
    const next = [...messages, { role: 'user', text }]
    setMessages(next)
    setInput('')
    setSending(true)
    try {
      const { data } = await apiService.chat.send(
        next.filter((m) => m !== GREETING && !m.error).map(({ role, text }) => ({ role, text })),
        chatSessionId(),
      )
      setMessages((m) => [...m, { role: 'assistant', text: data.reply, products: data.products, handoff: data.handoff }])
    } catch (error) {
      const limited = error?.response?.status === 429
      setMessages((m) => [...m, {
        role: 'assistant', error: true, handoff: 'human',
        text: limited ? "You're sending messages quickly — give me a minute, or reach the team directly:" : "I'm having trouble connecting right now. You can reach the team directly:",
      }])
    } finally {
      setSending(false)
    }
  }

  sendRef.current = send

  const reset = () => { setMessages([GREETING]); setInput('') }
  const close = () => setOpen(false)
  const lastUserText = [...messages].reverse().find((m) => m.role === 'user')?.text
  const showSuggestions = messages.length === 1 && !sending

  return (
    <>
      <style>{CSS}</style>

      <AnimatePresence>
        {open && (
          <motion.div
            className="bluechat-panel"
            role="dialog"
            aria-label="Blue-Tech AI assistant"
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <header className="bluechat-header">
              <div className="bluechat-avatar"><Sparkles size={16} /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, fontFamily: '"Space Grotesk",sans-serif' }}>Blue · AI assistant</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="bluechat-dot" /> Online · usually answers instantly
                </div>
              </div>
              <button className="bluechat-icon" onClick={reset} aria-label="Start a new conversation" title="New conversation"><RotateCcw size={15} /></button>
              <button className="bluechat-icon" onClick={close} aria-label="Close chat"><X size={17} /></button>
            </header>

            <div className="bluechat-body" ref={scrollRef} aria-live="polite">
              {messages.map((m, i) => (
                <div key={i} className={`bluechat-row ${m.role}`}>
                  <div className={`bluechat-bubble ${m.role}`}><RichText text={m.text} /></div>
                  {m.products?.length > 0 && (
                    <div className="bluechat-products">
                      {m.products.map((p) => <ProductChip key={p.productId} product={p} onNavigate={() => window.innerWidth < 520 && close()} />)}
                    </div>
                  )}
                  {(m.handoff === 'quote' || m.handoff === 'human') && (
                    <Handoff kind={m.handoff} lastQuestion={lastUserText} onNavigate={() => window.innerWidth < 520 && close()} />
                  )}
                </div>
              ))}

              {sending && (
                <div className="bluechat-row assistant">
                  <div className="bluechat-bubble assistant bluechat-typing"><span /><span /><span /></div>
                </div>
              )}

              {showSuggestions && (
                <div className="bluechat-suggestions">
                  {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(s)}>{s}</button>)}
                </div>
              )}
            </div>

            <form className="bluechat-composer" onSubmit={(e) => { e.preventDefault(); send() }}>
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={1000}
                placeholder="Ask about a product, budget, delivery…"
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              />
              <button type="submit" className="bluechat-send" disabled={!input.trim() || sending} aria-label="Send message"><ArrowUp size={17} /></button>
            </form>
            <div className="bluechat-foot">AI can make mistakes — check details on the product page. Chats are saved anonymously to improve answers.</div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className={`bluechat-launcher ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Close chat' : 'Chat with our AI assistant'}
        whileHover={reduce ? undefined : { scale: 1.05 }}
        whileTap={reduce ? undefined : { scale: 0.95 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={open ? 'x' : 'chat'} initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'flex' }}>
            {open ? <X size={22} /> : <Sparkles size={22} />}
          </motion.span>
        </AnimatePresence>
      </motion.button>
    </>
  )
}

const CSS = `
.bluechat-launcher{position:fixed;right:20px;bottom:20px;z-index:60;width:56px;height:56px;border-radius:50%;border:1px solid rgba(255,255,255,.12);
  background:linear-gradient(140deg,var(--accent-light,var(--accent)),var(--accent));color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;
  box-shadow:0 10px 30px -6px var(--accent),0 0 0 6px var(--accent-dim)}
.bluechat-launcher:not(.is-open)::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:2px solid var(--accent);opacity:0;animation:bluechat-ping 2.8s ease-out infinite}
@keyframes bluechat-ping{0%{transform:scale(.9);opacity:.6}70%,100%{transform:scale(1.25);opacity:0}}
.bluechat-panel{position:fixed;right:20px;bottom:88px;z-index:60;width:384px;height:min(600px,calc(100vh - 120px));display:flex;flex-direction:column;
  background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:20px;overflow:hidden;box-shadow:0 30px 80px -20px rgba(0,0,0,.55);transform-origin:bottom right}
.bluechat-header{display:flex;align-items:center;gap:10px;padding:14px 12px 14px 16px;border-bottom:1px solid var(--border);
  background:radial-gradient(120% 140% at 0% 0%,var(--accent-dim),transparent 60%)}
.bluechat-avatar{width:34px;height:34px;border-radius:11px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;
  background:linear-gradient(140deg,var(--accent-light,var(--accent)),var(--accent))}
.bluechat-dot{width:6px;height:6px;border-radius:50%;background:var(--color-success,#22c55e);box-shadow:0 0 0 3px rgba(34,197,94,.18)}
.bluechat-icon{width:32px;height:32px;border-radius:9px;border:0;background:transparent;color:var(--muted);display:flex;align-items:center;justify-content:center;cursor:pointer}
.bluechat-icon:hover{background:var(--accent-dim);color:var(--text)}
.bluechat-body{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:12px;overscroll-behavior:contain}
.bluechat-row{display:flex;flex-direction:column;gap:8px;max-width:88%}
.bluechat-row.user{align-self:flex-end;align-items:flex-end}
.bluechat-row.assistant{align-self:flex-start}
.bluechat-bubble{padding:10px 13px;border-radius:16px;font-size:13.5px;line-height:1.55;word-wrap:break-word}
.bluechat-bubble.assistant{background:var(--bg-input,rgba(127,127,127,.1));border:1px solid var(--border);border-bottom-left-radius:5px}
.bluechat-bubble.user{background:var(--accent);color:#fff;border-bottom-right-radius:5px}
.bluechat-typing{display:flex;gap:4px;padding:13px 14px}
.bluechat-typing span{width:6px;height:6px;border-radius:50%;background:var(--muted);animation:bluechat-bounce 1.2s infinite}
.bluechat-typing span:nth-child(2){animation-delay:.15s}.bluechat-typing span:nth-child(3){animation-delay:.3s}
@keyframes bluechat-bounce{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-4px);opacity:1}}
.bluechat-products{display:flex;flex-direction:column;gap:6px;width:100%}
.bluechat-product{display:flex;align-items:center;gap:10px;padding:8px;border-radius:12px;border:1px solid var(--border);background:var(--bg);text-decoration:none;color:var(--text);transition:border-color .15s,transform .15s}
.bluechat-product:hover{border-color:var(--accent);transform:translateX(2px)}
.bluechat-product-img{width:44px;height:44px;border-radius:9px;background:#fff;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden;color:var(--accent)}
.bluechat-product-img img{width:100%;height:100%;object-fit:contain}
.bluechat-product-name{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bluechat-actions{display:flex;flex-wrap:wrap;gap:6px}
.bluechat-action{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;padding:7px 11px;border-radius:999px;border:1px solid var(--border);color:var(--text);text-decoration:none}
.bluechat-action.primary{background:var(--accent);border-color:var(--accent);color:#fff}
.bluechat-suggestions{display:flex;flex-direction:column;gap:6px;align-items:flex-start;margin-top:4px}
.bluechat-suggestions button{font-size:12.5px;text-align:left;padding:8px 12px;border-radius:12px;border:1px solid var(--border);background:transparent;color:var(--text);cursor:pointer;transition:border-color .15s,background .15s}
.bluechat-suggestions button:hover{border-color:var(--accent);background:var(--accent-dim)}
.bluechat-composer{display:flex;align-items:flex-end;gap:8px;margin:0 12px;padding:6px 6px 6px 14px;border:1px solid var(--border);border-radius:16px;background:var(--bg)}
.bluechat-composer:focus-within{border-color:var(--accent)}
.bluechat-composer textarea{flex:1;resize:none;border:0;outline:0;background:transparent;color:var(--text);font:inherit;font-size:13.5px;line-height:1.4;padding:7px 0;max-height:110px}
.bluechat-send{width:34px;height:34px;border-radius:11px;border:0;background:var(--accent);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0}
.bluechat-send:disabled{opacity:.35;cursor:default}
.bluechat-foot{font-size:10.5px;color:var(--muted-dark,var(--muted));text-align:center;padding:7px 12px 10px}
@media (max-width:520px){
  .bluechat-panel{inset:0;width:auto;height:100dvh;border-radius:0;border:0}
  .bluechat-launcher.is-open{display:none}
  .bluechat-launcher{right:16px;bottom:16px}
}
@media (prefers-reduced-motion:reduce){.bluechat-launcher::after,.bluechat-typing span{animation:none}}
`
