import { useSearchParams, Link } from 'react-router-dom'
import { useEffect } from 'react'
import { MessageCircle, Mail, Phone, Sparkles, MapPin } from 'lucide-react'
import { Reveal } from '../lib/motion'
import { SUPPORT_EMAIL, WHATSAPP_NUMBER } from '../lib/helpLinks'
import { openLiveChat } from '../lib/liveChat'
import { usePageMeta } from '../hooks/usePageMeta'

// Only facts the store already commits to elsewhere on the site (checkout fees, product
// warranty fields, payment providers, footer contacts). Anything the owner hasn't confirmed
// — exact delivery days per district, opening hours — is deliberately left out.
const STORE_ADDRESS = 'KN59, ST 38, near Gloria Hotel, Kigali, Rwanda'

const SECTIONS = {
  faq: {
    nav: 'FAQ',
    title: 'Frequently asked questions',
    qa: [
      ['How much is delivery?', 'Standard delivery is free anywhere in Rwanda. Express next-day delivery costs 7,500 RWF and can be chosen at checkout.'],
      ['How do I pay?', 'With MTN Mobile Money, Airtel Money or a bank card. You choose at checkout, and mobile money asks you to confirm on your phone.'],
      ['Can I track my order?', 'Yes. Sign in and open My orders to see the status of every order, from payment to delivery.'],
      ['What warranty do I get?', 'Every product page shows its warranty (for example "6 months"). Keep your order number — it is all you need to make a claim.'],
      ['Can I return something?', 'Yes, within 30 days of delivery if it is unused and in its original packaging. See Returns below.'],
      ['Do you sell to schools, offices and NGOs?', 'Yes. For interactive screens and bulk orders, request a quote and we will reply with pricing for your whole order.'],
      ['I need help choosing.', 'Ask Blue, our AI assistant (the button at the bottom right), or message us on WhatsApp — we will point you to the right machine for your budget.'],
    ],
  },
  shipping: {
    nav: 'Delivery',
    title: 'Delivery',
    paras: [
      'We deliver across Rwanda from our shop in Kigali.',
      '• Standard delivery — free, everywhere in Rwanda.\n• Express next-day delivery — 7,500 RWF, chosen at checkout.',
      'When you check out, choose your province and district and add a nearby landmark — it helps the courier find you quickly. Keep your phone on: the courier calls the number on your order.',
      'You can follow every order under My orders once you are signed in.',
    ],
  },
  returns: {
    nav: 'Returns',
    title: 'Returns & exchanges',
    paras: [
      'You can return or exchange a product within 30 days of delivery.',
      '• The product must be unused, complete and in its original packaging.\n• Have your order number ready.',
      'To start a return, contact us by WhatsApp, phone or email (below) with your order number and the reason. We will tell you how to send or drop off the product.',
      'A faulty product is handled under its warranty — see Warranty.',
    ],
  },
  warranty: {
    nav: 'Warranty',
    title: 'Warranty',
    paras: [
      'Every product page lists that product\'s warranty period. It covers manufacturing faults from the delivery date.',
      'It does not cover accidental damage (drops, liquid, broken screens), normal wear, or repairs and modifications made elsewhere.',
      'To make a claim, contact us with your order number and a short description or photo of the problem.',
    ],
  },
  payments: {
    nav: 'Payments',
    title: 'Payments',
    paras: [
      'We accept MTN Mobile Money, Airtel Money and bank cards (Visa, Mastercard).',
      'Mobile money: after you place the order, approve the payment prompt on your phone. Card payments are processed securely by our card provider — Blue-Tech never sees or stores your card number.',
      'Prices are in Rwandan francs (RWF). You can view them in US dollars with the currency switch at the top of the page; you are charged the amount shown at checkout.',
    ],
  },
  privacy: {
    nav: 'Privacy',
    title: 'Privacy policy',
    draft: true,
    paras: [
      'Blue-Tech ("we") respects your privacy and handles personal data in line with Rwanda\'s Law No. 058/2021 on the protection of personal data and privacy.',
      'What we collect\n• Account details: name, email, phone number and password (stored only as a secure hash, never in readable form).\n• Delivery addresses you give us.\n• Orders, payments status and reviews you write.\n• Questions you send to Blue, our AI assistant — stored without your name or account, to improve its answers.\n• Basic technical data needed to run the site securely (for example your IP address for fraud and abuse protection).',
      'Why we use it\nTo process and deliver your orders, take payment, provide warranty and support, keep your account secure, and — only if you subscribe — send our newsletter.',
      'Who we share it with\nOnly the services needed to run the shop: our payment providers (mobile money and card), our delivery partners, our hosting and email providers, and Google\'s AI service, which answers chat questions. We do not sell your data.',
      'Your rights\nYou can ask to see, correct or delete your personal data, or unsubscribe from emails at any time. Contact us using the details below.',
      'We keep order records for as long as the law requires for accounting and warranty purposes, and other data only as long as needed.',
    ],
  },
  terms: {
    nav: 'Terms',
    title: 'Terms of sale',
    draft: true,
    paras: [
      'These terms apply to orders placed on the Blue-Tech website.',
      'Prices and availability\nPrices are in Rwandan francs and include applicable taxes unless stated otherwise. We may correct obvious pricing errors; if that affects your order we will contact you before processing it.',
      'Orders and payment\nAn order is confirmed once payment succeeds. We may cancel an order (with a full refund) if a product turns out to be unavailable.',
      'Delivery, returns and warranty\nSee the Delivery, Returns and Warranty sections of this help page — they form part of these terms.',
      'Your account\nKeep your password private. You are responsible for orders placed from your account.',
      'Contact\nQuestions about these terms: use the contact details below.',
    ],
  },
  cookies: {
    nav: 'Cookies',
    title: 'Cookies & local storage',
    draft: true,
    paras: [
      'We use your browser\'s storage only for things the site needs to work and to remember your choices:',
      '• Keeping you signed in.\n• Your cart (also before you sign in), wishlist and products picked for comparison.\n• Your theme (light/dark) and currency choice.\n• Your recent chat with Blue for the current visit.',
      'We do not use advertising cookies. Clearing your browser data removes all of the above.',
    ],
  },
}

const ORDER = ['faq', 'shipping', 'returns', 'warranty', 'payments', 'privacy', 'terms', 'cookies']

function Paragraph({ text }) {
  const [first, ...rest] = text.split('\n')
  const isHeading = rest.length > 0 && !first.startsWith('•')
  const lines = isHeading ? rest : text.split('\n')
  return (
    <div>
      {isHeading && <h3 style={{ color: 'var(--text)', fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{first}</h3>}
      {lines.map((l, i) => (
        <p key={i} style={{ margin: l.startsWith('•') ? '2px 0 2px 4px' : 0 }}>{l}</p>
      ))}
    </div>
  )
}

export default function HelpPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sectionKey = SECTIONS[searchParams.get('v')] ? searchParams.get('v') : 'faq'
  const section = SECTIONS[sectionKey]
  usePageMeta({ title: `${section.title} | Blue-Tech`, description: `${section.title} — Blue-Tech, Kigali.` })

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [sectionKey])

  return (
    <div style={{ padding: '56px 0 80px' }}>
      <div className="container-noir help-layout">
        <nav aria-label="Help sections" className="help-nav">
          {ORDER.map(key => (
            <button key={key} onClick={() => setSearchParams({ v: key })}
              className={`help-nav-item ${key === sectionKey ? 'on' : ''}`} aria-current={key === sectionKey ? 'page' : undefined}>
              {SECTIONS[key].nav}
            </button>
          ))}
        </nav>

        <div>
          <Reveal>
            <h1 style={{ fontSize: 'clamp(28px, 4vw, 36px)', fontWeight: 900, marginBottom: 12, letterSpacing: '-0.03em', color: 'var(--text)' }}>
              {section.title}
            </h1>
            <div style={{ width: 40, height: 2, background: 'var(--accent)', marginBottom: 32 }} />
          </Reveal>

          <div style={{ color: 'var(--muted)', fontSize: 15.5, lineHeight: 1.75, display: 'flex', flexDirection: 'column', gap: 22 }}>
            {section.qa?.map(([q, a]) => (
              <div key={q}>
                <h3 style={{ color: 'var(--text)', fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{q}</h3>
                <p style={{ margin: 0 }}>{a}</p>
              </div>
            ))}
            {section.paras?.map((p, i) => <Paragraph key={i} text={p} />)}
            {section.draft && (
              <p style={{ fontSize: 12.5, color: 'var(--muted-dark)', margin: 0 }}>Last updated October 2026.</p>
            )}
          </div>

          <div style={{ marginTop: 56, padding: 28, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
            <h2 style={{ color: 'var(--text)', fontSize: 18, fontWeight: 800, marginBottom: 6 }}>Still have questions?</h2>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 18 }}>Ask Blue any time, or reach the team directly.</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button onClick={() => openLiveChat()} className="noir-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 13.5, padding: '10px 16px' }}>
                <Sparkles size={15} /> Ask Blue
              </button>
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="help-contact"><MessageCircle size={15} /> WhatsApp</a>
              <a href="tel:+250788304366" className="help-contact"><Phone size={15} /> +250 788 304 366</a>
              <a href={`mailto:${SUPPORT_EMAIL}`} className="help-contact"><Mail size={15} /> {SUPPORT_EMAIL}</a>
            </div>
            <p style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--muted-dark)', marginTop: 16 }}>
              <MapPin size={13} /> {STORE_ADDRESS}
            </p>
          </div>
          <p style={{ fontSize: 13, color: 'var(--muted-dark)', marginTop: 18 }}>
            Looking for an order? <Link to="/orders" style={{ color: 'var(--accent-light, var(--accent))' }}>Go to My orders</Link>
          </p>
        </div>
      </div>
      <style>{`
        .help-layout{display:grid;grid-template-columns:200px minmax(0,1fr);gap:48px;align-items:start;max-width:1040px}
        .help-nav{position:sticky;top:96px;display:flex;flex-direction:column;gap:2px}
        .help-nav-item{text-align:left;padding:9px 12px;border-radius:9px;border:0;background:transparent;color:var(--muted);font-size:14px;font-weight:500;cursor:pointer;font-family:inherit}
        .help-nav-item:hover{color:var(--text);background:var(--accent-dim)}
        .help-nav-item.on{color:var(--text);background:var(--accent-dim);font-weight:700}
        .help-contact{display:inline-flex;align-items:center;gap:7px;padding:10px 14px;border-radius:10px;border:1px solid var(--border);color:var(--text);font-size:13.5px;text-decoration:none}
        .help-contact:hover{border-color:var(--accent)}
        @media (max-width:760px){
          .help-layout{grid-template-columns:1fr;gap:20px}
          .help-nav{position:static;flex-direction:row;overflow-x:auto;scrollbar-width:none;gap:6px}
          .help-nav-item{white-space:nowrap;border:1px solid var(--border)}
        }
      `}</style>
    </div>
  )
}
