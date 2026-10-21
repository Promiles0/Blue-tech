import { useEffect, useRef, useState } from 'react'
import { useT } from '../../lib/i18n'
import { Link, useLocation } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { X, ArrowUp, RotateCcw, MessageCircle, Mail, FileText, ThumbsUp, ThumbsDown, RefreshCw, ImageOff } from 'lucide-react'
import apiService from '../../api/service'
import { useCurrency } from '../../context/CurrencyContext'
import { onLiveChatOpen } from '../../lib/liveChat'
import { SUPPORT_EMAIL, WHATSAPP_NUMBER } from '../../lib/helpLinks'

// Blue — the storefront's AI shopping assistant. Answers come from POST /chat (a chain of AI
// providers grounded in the published catalogue); the conversation lives in sessionStorage so
// it survives page navigation but not a new visit.
const STORAGE_KEY = 'bluechat-v1'
// Anonymous per-tab id so Admin → Blue can group turns into conversations.
const SESSION_KEY = 'bluechat-session'
const TEASER_KEY = 'bluechat-teaser-seen'
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
  greeting: true, // shown through t() so it follows the site language
  text: "Hi, I'm Blue 👋 Tell me what you'll use it for and your budget, and I'll find the right machine. I can also answer questions about delivery, warranty and returns.",
}
// What the waiting bubble says, by seconds elapsed. Backups kick in around 8–12 s, so the
// later steps make a slow answer look deliberate rather than stuck.
const THINKING_STEPS = [
  [0, 'Reading your question…'],
  [2, 'Searching our catalogue…'],
  [4.5, 'Comparing prices and specs…'],
  [8, 'Still working — checking another source…'],
  [18, 'Almost there, thanks for waiting…'],
]
const REQUEST_TIMEOUT_MS = 30000

function loadHistory() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null')
    return Array.isArray(saved) && saved.length ? saved : [GREETING]
  } catch { return [GREETING] }
}

// The "B" from the Blue-Tech wordmark (same shape as the app icon).
export function BlueMark({ size = 16 }) {
  return (
    <svg width={size * 0.8} height={size} viewBox="0 -215 175 220" aria-hidden="true" style={{ display: 'block' }}>
      <path fill="currentColor" d="M 14.796875 -203.4375 L 77.921875 -203.4375 C 96.992188 -203.4375 112.203125 -199.367188 123.546875 -191.234375 C 134.890625 -183.097656 140.5625 -169.90625 140.5625 -151.65625 C 140.5625 -131.269531 132.09375 -116.722656 115.15625 -108.015625 C 144.09375 -102.910156 158.5625 -85.8125 158.5625 -56.71875 C 158.5625 -39.625 152.640625 -25.894531 140.796875 -15.53125 C 128.960938 -5.175781 112.691406 0 91.984375 0 L 14.796875 0 Z M 61.15625 -123.796875 L 64.859375 -123.796875 C 75.210938 -123.796875 82.9375 -125.601562 88.03125 -129.21875 C 93.125 -132.832031 95.671875 -138.75 95.671875 -146.96875 C 95.671875 -160.78125 85.398438 -167.6875 64.859375 -167.6875 L 61.15625 -167.6875 Z M 61.15625 -35.75 L 75.703125 -35.75 C 98.390625 -35.75 109.734375 -43.3125 109.734375 -58.4375 C 109.734375 -67.476562 106.894531 -73.972656 101.21875 -77.921875 C 95.550781 -81.867188 87.046875 -83.84375 75.703125 -83.84375 L 61.15625 -83.84375 Z M 61.15625 -35.75" />
    </svg>
  )
}

// Blue always writes prices as "1,450,000 RWF"; shoppers viewing USD get the same
// conversion as the product cards, so text and cards never disagree.
function usePriceText() {
  const { currency, formatPrice } = useCurrency()
  return (text) => currency === 'RWF' ? text
    : text.replace(/(\d{1,3}(?:[,\s]\d{3})+|\d{4,})(?:\.\d+)?\s?(?:RWF|Rwf|rwf|FRW|Frw|frw)\b/g, (_, n) => formatPrice(Number(n.replace(/[,\s]/g, ''))))
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

// Reveals a fresh reply word by word (under ~1.2 s in total), then reports it's done.
function TypedText({ text, animate, onDone }) {
  const words = text.split(/(\s+)/)
  const [shown, setShown] = useState(animate ? 0 : Infinity)
  const doneRef = useRef(onDone)
  useEffect(() => { doneRef.current = onDone })
  useEffect(() => {
    if (!animate) { doneRef.current?.(); return }
    const total = Math.min(Math.max(words.length * 28, 300), 1200)
    const step = Math.max(1, Math.round(words.length / (total / 30)))
    let count = 0
    const timer = setInterval(() => {
      count = Math.min(words.length, count + step)
      if (count >= words.length) { clearInterval(timer); setShown(Infinity); doneRef.current?.() }
      else setShown(count)
    }, 30)
    return () => clearInterval(timer)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- runs once per message
  // Once finished, always the full (possibly re-translated or re-priced) text.
  return <RichText text={shown === Infinity ? text : words.slice(0, shown).join('')} />
}

function ProductCard({ product, onNavigate, index, animate }) {
  const { formatPrice } = useCurrency()
  const { t } = useT()
  return (
    <motion.div
      initial={animate ? { opacity: 0, y: 8 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: animate ? index * 0.09 : 0 }}
    >
      <Link to={`/products/${product.productId}`} onClick={onNavigate} className="bluechat-product">
        <div className="bluechat-product-img">
          {product.imageUrl ? <img src={product.imageUrl} alt="" loading="lazy" /> : <ImageOff size={16} />}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div className="bluechat-product-name">{product.name}</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--price, var(--accent))' }}>{formatPrice(product.price)}</div>
        </div>
        <span className="bluechat-product-view">{t('View')}</span>
      </Link>
    </motion.div>
  )
}

function Handoff({ kind, lastQuestion, onNavigate }) {
  const { t } = useT()
  if (kind === 'quote') {
    return (
      <div className="bluechat-actions">
        <Link to="/interactive-screens?quote=1" onClick={onNavigate} className="bluechat-action primary"><FileText size={13} /> {t('Request a quote')}</Link>
      </div>
    )
  }
  const waText = encodeURIComponent(t('Hi Blue-Tech! I was chatting with your assistant and need help with: {q}', { q: lastQuestion ?? '' }))
  return (
    <div className="bluechat-actions">
      <a href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`} target="_blank" rel="noreferrer" className="bluechat-action primary"><MessageCircle size={13} /> {t('WhatsApp the team')}</a>
      <a href={`mailto:${SUPPORT_EMAIL}`} className="bluechat-action"><Mail size={13} /> {t('Email us')}</a>
    </div>
  )
}

// Quick replies after Blue's latest answer, picked from what it showed — no AI call needed.
function followUps(m) {
  const n = m.products?.length ?? 0
  const list = []
  if (n >= 2) list.push('Compare these for me')
  if (n >= 1) list.push('Is there a cheaper option?', 'Something more powerful?')
  if (!n && m.handoff === 'none') list.push('Show me your best laptops')
  list.push('How long does delivery take?')
  return list.slice(0, 3)
}

function Avatar() {
  return <div className="bluechat-mini-avatar"><BlueMark size={12} /></div>
}

function AssistantMessage({ m, isLast, busy, lastUserText, onDone, onFeedback, onRetry, onAsk, onNavigate }) {
  const { t } = useT()
  const priceText = usePriceText()
  const reduce = useReducedMotion()
  // Decided once: the parent clears `fresh` when typing ends, but the cards still animate in.
  const [animate] = useState(() => Boolean(m.fresh) && !reduce)
  const [typed, setTyped] = useState(!animate)
  const text = m.greeting || m.text === GREETING.text ? t(GREETING.text) : priceText(m.text)

  return (
    <div className="bluechat-row assistant">
      <Avatar />
      <div className="bluechat-col">
        <div className={`bluechat-bubble assistant ${m.error ? 'is-error' : ''}`}>
          <TypedText text={text} animate={animate} onDone={() => { setTyped(true); onDone?.() }} />
        </div>
        {typed && m.products?.length > 0 && (
          <div className="bluechat-products">
            {m.products.map((p, i) => <ProductCard key={p.productId} product={p} index={i} animate={animate} onNavigate={onNavigate} />)}
          </div>
        )}
        {typed && m.retry && (
          <div className="bluechat-actions">
            <button type="button" className="bluechat-action primary" onClick={onRetry} disabled={busy}><RefreshCw size={13} /> {t('Try again')}</button>
          </div>
        )}
        {typed && (m.handoff === 'quote' || m.handoff === 'human') && (
          <Handoff kind={m.handoff} lastQuestion={lastUserText} onNavigate={onNavigate} />
        )}
        {typed && m.turnId && (
          <div className="bluechat-feedback">
            <button type="button" className={m.feedback === 1 ? 'is-on' : ''} onClick={() => onFeedback(m.feedback === 1 ? 0 : 1)} aria-label={t('Helpful')} aria-pressed={m.feedback === 1} title={t('Helpful')}><ThumbsUp size={12} /></button>
            <button type="button" className={m.feedback === -1 ? 'is-on' : ''} onClick={() => onFeedback(m.feedback === -1 ? 0 : -1)} aria-label={t('Not helpful')} aria-pressed={m.feedback === -1} title={t('Not helpful')}><ThumbsDown size={12} /></button>
            {m.feedback === -1 && <span>{t('Thanks — our team will review this answer.')}</span>}
            {m.feedback === 1 && <span>{t('Thanks for the feedback!')}</span>}
          </div>
        )}
        {typed && isLast && !busy && !m.greeting && !m.error && (
          <motion.div className="bluechat-chips" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
            {followUps(m).map((q) => <button key={q} type="button" onClick={() => onAsk(t(q))}>{t(q)}</button>)}
          </motion.div>
        )}
      </div>
    </div>
  )
}

function Thinking({ startedAt }) {
  const { t } = useT()
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 500)
    return () => clearInterval(timer)
  }, [])
  const seconds = (now - startedAt) / 1000
  const label = [...THINKING_STEPS].reverse().find(([at]) => seconds >= at)[1]
  return (
    <div className="bluechat-row assistant" aria-label={t('Blue is typing')}>
      <Avatar />
      <div className="bluechat-col">
        <div className="bluechat-bubble assistant bluechat-thinking">
          <span className="bluechat-typing"><span /><span /><span /></span>
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={label} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}>
              {t(label)}
            </motion.span>
          </AnimatePresence>
        </div>
        <div className="bluechat-skeleton" />
        <div className="bluechat-skeleton" style={{ width: '82%' }} />
      </div>
    </div>
  )
}

export default function ChatWidget() {
  const { t, lang } = useT()
  const location = useLocation()
  const reduce = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState(loadHistory)
  const [input, setInput] = useState('')
  const [sentAt, setSentAt] = useState(null) // when the pending question was sent; null = idle
  const [teaser, setTeaser] = useState(false)
  const scrollRef = useRef(null)
  const inputRef = useRef(null)
  const sending = sentAt !== null

  // Latest send(), so an "ask this now" event never calls a stale closure.
  const sendRef = useRef(null)

  useEffect(() => onLiveChatOpen(({ prefill, send }) => {
    setOpen(true)
    if (prefill && send) setTimeout(() => sendRef.current?.(prefill), 0)
    else if (prefill) setInput(prefill)
  }), [])

  useEffect(() => {
    // `fresh` only drives the typing animation; never replay it after a reload.
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-30).map(({ fresh, ...m }) => m))) } catch { /* non-fatal */ }
  }, [messages])

  const scrollDown = () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: reduce ? 'auto' : 'smooth' })
  useEffect(() => { scrollDown() }, [messages, sending, open]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (open) setTimeout(() => inputRef.current?.focus(), 150) }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // A one-time "Hi!" bubble beside the launcher, once per visit, for people who haven't chatted yet.
  useEffect(() => {
    let seen = false
    try { seen = sessionStorage.getItem(TEASER_KEY) === '1' } catch { /* show it */ }
    if (seen || messages.length > 1) return
    const show = setTimeout(() => {
      setTeaser(true)
      try { sessionStorage.setItem(TEASER_KEY, '1') } catch { /* non-fatal */ }
    }, 8000)
    return () => clearTimeout(show)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- once per page load
  useEffect(() => {
    if (!teaser) return
    const hide = setTimeout(() => setTeaser(false), 12000)
    return () => clearTimeout(hide)
  }, [teaser])
  useEffect(() => { if (open) setTeaser(false) }, [open])

  // Sends the conversation (ending in the customer's question) and appends Blue's answer.
  const ask = async (history) => {
    setSentAt(Date.now())
    try {
      const { data } = await apiService.chat.send(
        history.filter((m) => !m.greeting && m.text !== GREETING.text && !m.error).map(({ role, text }) => ({ role, text })),
        chatSessionId(),
        lang,
        REQUEST_TIMEOUT_MS,
      )
      setMessages((m) => [...m, { role: 'assistant', text: data.reply, products: data.products, handoff: data.handoff, turnId: data.turnId, fresh: true }])
    } catch (error) {
      const limited = error?.response?.status === 429
      const slow = error?.code === 'ECONNABORTED' || !error?.response
      setMessages((m) => [...m, {
        role: 'assistant', error: true, handoff: 'human', retry: !limited, fresh: true,
        text: limited ? t("You're sending messages quickly — give me a minute, or reach the team directly:")
          : slow ? t('This is taking longer than usual. Try again, or reach the team directly:')
          : t("I'm having trouble connecting right now. You can reach the team directly:"),
      }])
    } finally {
      setSentAt(null)
    }
  }

  const send = (raw) => {
    const text = (raw ?? input).trim()
    if (!text || sending) return
    const next = [...messages, { role: 'user', text }]
    setMessages(next)
    setInput('')
    ask(next)
  }

  // Drop the failed answer and ask the same question again.
  const retry = () => {
    if (sending) return
    const history = messages.at(-1)?.error ? messages.slice(0, -1) : messages
    setMessages(history)
    ask(history)
  }

  const rate = (index, value) => {
    const m = messages[index]
    setMessages((all) => all.map((x, i) => (i === index ? { ...x, feedback: value } : x)))
    apiService.chat.feedback(m.turnId, chatSessionId(), value).catch(() => { /* best effort */ })
  }

  // Keep the latest send() for the open-and-ask event (updated after render, not during it).
  useEffect(() => { sendRef.current = send })

  if (HIDDEN_ON.some((p) => location.pathname.startsWith(p))) return null

  const reset = () => { setMessages([GREETING]); setInput('') }
  const close = () => setOpen(false)
  const navigateFromChat = () => window.innerWidth < 520 && close()
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
            aria-label={t('Blue-Tech AI assistant')}
            initial={reduce ? false : { opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.22, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <header className="bluechat-header">
              <div className="bluechat-avatar"><BlueMark size={17} /><span className="bluechat-avatar-dot" /></div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, fontFamily: '"Space Grotesk",sans-serif' }}>Blue · {t('AI assistant')}</div>
                <div style={{ fontSize: 11, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span className="bluechat-dot" /> {sending ? t('Blue is typing') + '…' : t('Online · replies in seconds')}
                </div>
              </div>
              <button className="bluechat-icon" onClick={reset} aria-label={t('Start a new conversation')} title={t('New conversation')}><RotateCcw size={15} /></button>
              <button className="bluechat-icon" onClick={close} aria-label={t('Close chat')}><X size={17} /></button>
            </header>

            <div className="bluechat-body" ref={scrollRef} aria-live="polite">
              {messages.map((m, i) => m.role === 'user' ? (
                <div key={i} className="bluechat-row user">
                  <div className="bluechat-bubble user"><RichText text={m.text} /></div>
                </div>
              ) : (
                <AssistantMessage
                  key={i}
                  m={m}
                  isLast={i === messages.length - 1}
                  busy={sending}
                  lastUserText={lastUserText}
                  onDone={() => { if (m.fresh) { setMessages((all) => all.map((x, j) => (j === i ? { ...x, fresh: false } : x))); setTimeout(scrollDown, 60) } }}
                  onFeedback={(v) => rate(i, v)}
                  onRetry={retry}
                  onAsk={send}
                  onNavigate={navigateFromChat}
                />
              ))}

              {sending && <Thinking startedAt={sentAt} />}

              {showSuggestions && (
                <div className="bluechat-suggestions">
                  {SUGGESTIONS.map((s) => <button key={s} onClick={() => send(t(s))}>{t(s)}</button>)}
                </div>
              )}
            </div>

            <form className="bluechat-composer" onSubmit={(e) => { e.preventDefault(); send() }}>
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={1000}
                placeholder={t('Ask about a product, budget, delivery…')}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              />
              <button type="submit" className="bluechat-send" disabled={!input.trim() || sending} aria-label={t('Send message')}><ArrowUp size={17} /></button>
            </form>
            <div className="bluechat-foot">{t('AI can make mistakes — check details on the product page. Chats are saved anonymously to improve answers.')}</div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {teaser && !open && (
          <motion.div
            className="bluechat-teaser"
            initial={reduce ? false : { opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.2 }}
          >
            <button type="button" className="bluechat-teaser-text" onClick={() => setOpen(true)}>
              {t('Hi! Looking for a laptop or printer? Ask me 👋')}
            </button>
            <button type="button" className="bluechat-teaser-close" onClick={() => setTeaser(false)} aria-label={t('Dismiss')}><X size={13} /></button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        className={`bluechat-launcher ${open ? 'is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? t('Close chat') : t('Chat with our AI assistant')}
        whileHover={reduce ? undefined : { scale: 1.05 }}
        whileTap={reduce ? undefined : { scale: 0.95 }}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span key={open ? 'x' : 'chat'} initial={{ rotate: -45, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 45, opacity: 0 }} transition={{ duration: 0.15 }} style={{ display: 'flex' }}>
            {open ? <X size={22} /> : <BlueMark size={26} />}
          </motion.span>
        </AnimatePresence>
        {!open && <span className="bluechat-launcher-dot" />}
      </motion.button>
    </>
  )
}

const CSS = `
.bluechat-launcher{position:fixed;right:20px;bottom:20px;z-index:60;width:58px;height:58px;border-radius:50%;border:1px solid rgba(255,255,255,.14);
  background:var(--brand,#354380);color:#fff;display:flex;align-items:center;justify-content:center;cursor:pointer;
  box-shadow:0 12px 30px -8px rgba(53,67,128,.75),0 0 0 6px var(--accent-dim)}
.bluechat-launcher:not(.is-open)::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:2px solid var(--brand,#354380);opacity:0;animation:bluechat-ping 2.8s ease-out infinite}
.bluechat-launcher-dot{position:absolute;right:3px;bottom:3px;width:13px;height:13px;border-radius:50%;background:#f59e0b;border:2px solid var(--bg,#fff)}
@keyframes bluechat-ping{0%{transform:scale(.9);opacity:.6}70%,100%{transform:scale(1.25);opacity:0}}
.bluechat-teaser{position:fixed;right:88px;bottom:28px;z-index:60;display:flex;align-items:center;gap:2px;max-width:min(270px,calc(100vw - 110px));
  background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:16px 16px 4px 16px;box-shadow:0 14px 34px -14px rgba(0,0,0,.45)}
.bluechat-teaser-text{background:none;border:0;color:inherit;font:inherit;font-size:13px;line-height:1.4;text-align:left;padding:10px 4px 10px 13px;cursor:pointer}
.bluechat-teaser-close{flex-shrink:0;width:26px;height:26px;margin-right:5px;border-radius:8px;border:0;background:transparent;color:var(--muted);display:flex;align-items:center;justify-content:center;cursor:pointer}
.bluechat-teaser-close:hover{background:var(--accent-dim);color:var(--text)}
.bluechat-panel{position:fixed;right:20px;bottom:88px;z-index:60;width:390px;height:min(620px,calc(100vh - 120px));display:flex;flex-direction:column;
  background:var(--surface);color:var(--text);border:1px solid var(--border);border-radius:20px;overflow:hidden;box-shadow:0 30px 80px -20px rgba(0,0,0,.55);transform-origin:bottom right}
.bluechat-header{display:flex;align-items:center;gap:10px;padding:14px 12px 14px 16px;border-bottom:1px solid var(--border);
  background:radial-gradient(120% 140% at 0% 0%,var(--accent-dim),transparent 60%)}
.bluechat-avatar{position:relative;width:36px;height:36px;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#fff;flex-shrink:0;background:var(--brand,#354380)}
.bluechat-avatar-dot{position:absolute;right:-3px;bottom:-3px;width:11px;height:11px;border-radius:50%;background:#f59e0b;border:2px solid var(--surface)}
.bluechat-dot{width:6px;height:6px;border-radius:50%;background:var(--color-success,#22c55e);box-shadow:0 0 0 3px rgba(34,197,94,.18)}
.bluechat-icon{width:32px;height:32px;border-radius:9px;border:0;background:transparent;color:var(--muted);display:flex;align-items:center;justify-content:center;cursor:pointer}
.bluechat-icon:hover{background:var(--accent-dim);color:var(--text)}
.bluechat-body{flex:1;overflow-y:auto;padding:16px 14px;display:flex;flex-direction:column;gap:14px;overscroll-behavior:contain}
.bluechat-row{display:flex;gap:8px;max-width:92%}
.bluechat-row.user{align-self:flex-end;max-width:85%}
.bluechat-row.assistant{align-self:flex-start;align-items:flex-start}
.bluechat-col{display:flex;flex-direction:column;gap:8px;min-width:0;flex:1}
.bluechat-mini-avatar{width:26px;height:26px;border-radius:9px;flex-shrink:0;background:var(--brand,#354380);color:#fff;display:flex;align-items:center;justify-content:center;margin-top:2px}
.bluechat-bubble{padding:10px 13px;border-radius:16px;font-size:13.5px;line-height:1.55;word-wrap:break-word}
.bluechat-bubble.assistant{background:var(--bg-input,rgba(127,127,127,.1));border:1px solid var(--border);border-top-left-radius:5px}
.bluechat-bubble.assistant.is-error{border-color:rgba(245,158,11,.45)}
.bluechat-bubble.user{background:var(--accent);color:#fff;border-bottom-right-radius:5px}
.bluechat-thinking{display:flex;align-items:center;gap:9px;font-size:12.5px;color:var(--muted);min-height:40px}
.bluechat-typing{display:inline-flex;gap:4px}
.bluechat-typing span{width:6px;height:6px;border-radius:50%;background:var(--accent);animation:bluechat-bounce 1.2s infinite}
.bluechat-typing span:nth-child(2){animation-delay:.15s}.bluechat-typing span:nth-child(3){animation-delay:.3s}
@keyframes bluechat-bounce{0%,60%,100%{transform:translateY(0);opacity:.45}30%{transform:translateY(-4px);opacity:1}}
.bluechat-skeleton{height:56px;border-radius:12px;border:1px solid var(--border);
  background:linear-gradient(90deg,transparent 0,var(--accent-dim) 50%,transparent 100%) var(--bg-input,rgba(127,127,127,.1));background-size:220% 100%;animation:bluechat-shimmer 1.4s linear infinite}
@keyframes bluechat-shimmer{0%{background-position:120% 0}100%{background-position:-120% 0}}
.bluechat-products{display:flex;flex-direction:column;gap:6px;width:100%}
.bluechat-product{display:flex;align-items:center;gap:11px;padding:8px 10px 8px 8px;border-radius:12px;border:1px solid var(--border);background:var(--bg);text-decoration:none;color:var(--text);transition:border-color .15s,transform .15s}
.bluechat-product:hover{border-color:var(--accent);transform:translateX(2px)}
.bluechat-product-img{width:48px;height:48px;border-radius:9px;background:#fff;flex-shrink:0;display:flex;align-items:center;justify-content:center;overflow:hidden;color:var(--muted)}
.bluechat-product-img img{width:100%;height:100%;object-fit:contain}
.bluechat-product-name{font-size:12.5px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-bottom:2px}
.bluechat-product-view{flex-shrink:0;font-size:11.5px;font-weight:600;padding:5px 10px;border-radius:999px;background:var(--accent-dim);color:var(--accent-light,var(--accent))}
.bluechat-product:hover .bluechat-product-view{background:var(--accent);color:#fff}
.bluechat-actions{display:flex;flex-wrap:wrap;gap:6px}
.bluechat-action{display:inline-flex;align-items:center;gap:6px;font:inherit;font-size:12px;font-weight:600;padding:7px 11px;border-radius:999px;border:1px solid var(--border);background:transparent;color:var(--text);text-decoration:none;cursor:pointer}
.bluechat-action.primary{background:var(--accent);border-color:var(--accent);color:#fff}
.bluechat-action:disabled{opacity:.5;cursor:default}
.bluechat-feedback{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--muted)}
.bluechat-feedback button{width:26px;height:24px;border-radius:7px;border:1px solid transparent;background:transparent;color:var(--muted);display:flex;align-items:center;justify-content:center;cursor:pointer;transition:background .15s,color .15s}
.bluechat-feedback button:hover{background:var(--accent-dim);color:var(--text)}
.bluechat-feedback button.is-on{background:var(--accent-dim);border-color:var(--accent);color:var(--accent-light,var(--accent))}
.bluechat-feedback span{margin-left:4px}
.bluechat-chips{display:flex;flex-wrap:wrap;gap:6px}
.bluechat-chips button{font:inherit;font-size:12px;padding:6px 11px;border-radius:999px;border:1px solid var(--accent);background:transparent;color:var(--accent-light,var(--accent));cursor:pointer;transition:background .15s,color .15s}
.bluechat-chips button:hover{background:var(--accent);color:#fff}
.bluechat-suggestions{display:flex;flex-direction:column;gap:6px;align-items:flex-start;margin:0 0 0 34px}
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
  .bluechat-teaser{right:84px;bottom:22px}
  .bluechat-composer textarea{font-size:16px}
  .bluechat-foot{padding-bottom:max(10px,env(safe-area-inset-bottom))}
}
@media (prefers-reduced-motion:reduce){.bluechat-launcher::after,.bluechat-typing span,.bluechat-skeleton{animation:none}}
`
