import { Link } from 'react-router-dom'
import { BadgeCheck, Clock, CreditCard, Mail, MapPin, MessageCircle, Phone, RotateCcw, ShieldCheck, Truck } from 'lucide-react'
import { useT } from '../lib/i18n'
import { useStoreSettings } from '../lib/delivery'
import { WHATSAPP_NUMBER, SUPPORT_EMAIL } from '../lib/helpLinks'
import { usePageMeta, storeJsonLd, SITE_URL } from '../hooks/usePageMeta'

// About the shop (3c): who you are, where, when you're open, how to reach you, and what you
// promise. The story, hours and photo come from Admin → Settings → About page.
const DEFAULT_STORY = 'Blue-Tech is an electronics shop in Kigali. We sell laptops, desktops, printers and photocopiers, monitors, networking equipment, accessories and interactive screens for classrooms and offices — and deliver them across Rwanda.'

export default function AboutPage() {
  const { t } = useT()
  const { aboutPage = {}, businessInfo = {}, deliveryConfig } = useStoreSettings()
  const address = businessInfo.address || 'KN59, ST 38, near Gloria Hotel, Kigali, Rwanda'
  const phone = businessInfo.phone || '+250 788 304 366'
  const email = businessInfo.email || SUPPORT_EMAIL
  const span = (r) => (Array.isArray(r) ? (r[0] === r[1] ? `${r[0]}` : `${r[0]}–${r[1]}`) : '')

  usePageMeta({
    title: 'About Blue-Tech — electronics shop in Kigali, Rwanda',
    description: `Blue-Tech, ${address}. Laptops, computers, printers and interactive screens with warranty, delivered across Rwanda. ${aboutPage.hours ?? ''}`.trim(),
    path: '/about',
    jsonLd: { ...storeJsonLd(businessInfo), openingHours: aboutPage.hours || undefined, url: `${SITE_URL}/about` },
  })

  const facts = [
    { Icon: MapPin, title: t('Visit us'), body: address },
    { Icon: Clock, title: t('Opening hours'), body: aboutPage.hours || 'Mon–Sat 8:00–19:00 · Closed on Sunday' },
    { Icon: Truck, title: t('Delivery'), body: deliveryConfig
      ? t('Free standard delivery: {k} working days in Kigali, {p} to other districts. Express available.', { k: span(deliveryConfig.kigaliStandard), p: span(deliveryConfig.provinceStandard) })
      : t('Free standard delivery across Rwanda. Express available.') },
    { Icon: CreditCard, title: t('Payment'), body: t('MTN MoMo, Airtel Money or card') },
  ]
  const promises = [
    { Icon: BadgeCheck, text: t('Genuine products from authorised suppliers') },
    { Icon: ShieldCheck, text: t('Warranty on every product') },
    { Icon: RotateCcw, text: t('30-day returns') },
  ]

  return (
    <div className="container-noir" style={{ paddingTop: 56, paddingBottom: 72, maxWidth: 1000, marginLeft: 'auto', marginRight: 'auto' }}>
      <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 10 }}>{t('About us')}</p>
      <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-primary, var(--text))', margin: '0 0 18px', lineHeight: 1.1 }}>
        {t('Technology you can trust, from Kigali')}
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: aboutPage.photoUrl ? 'minmax(0, 1.2fr) minmax(0, 1fr)' : '1fr', gap: 28, alignItems: 'center', marginBottom: 36 }} className="about-intro">
        <div style={{ fontSize: 16, lineHeight: 1.75, color: 'var(--text-secondary, var(--muted))', whiteSpace: 'pre-line' }}>
          {aboutPage.story?.trim() || t(DEFAULT_STORY)}
        </div>
        {aboutPage.photoUrl && (
          <img src={aboutPage.photoUrl} alt={t('The Blue-Tech shop')} loading="lazy" style={{ width: '100%', borderRadius: 18, objectFit: 'cover', aspectRatio: '4 / 3', border: '1px solid var(--border)' }} />
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 12, marginBottom: 28 }}>
        {facts.map(({ Icon, title, body }) => (
          <div key={title} style={{ padding: 18, borderRadius: 14, border: '1px solid var(--border)', background: 'var(--bg-surface, transparent)' }}>
            <Icon size={18} style={{ color: 'var(--accent)', marginBottom: 10 }} />
            <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text-primary, var(--text))', marginBottom: 4 }}>{title}</div>
            <div style={{ fontSize: 13.5, color: 'var(--text-secondary, var(--muted))', lineHeight: 1.55 }}>{body}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px 22px', marginBottom: 32 }}>
        {promises.map(({ Icon, text }) => (
          <span key={text} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-primary, var(--text))' }}>
            <Icon size={16} style={{ color: 'var(--success, #22c55e)' }} /> {text}
          </span>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1.3fr)', gap: 20 }} className="about-contact">
        <div style={{ padding: 22, borderRadius: 16, border: '1px solid var(--border)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 14px', color: 'var(--text-primary, var(--text))' }}>{t('Talk to us')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
            <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)', textDecoration: 'none' }}><MessageCircle size={16} style={{ color: '#25D366' }} /> WhatsApp</a>
            <a href={`tel:${phone.replace(/\s+/g, '')}`} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)', textDecoration: 'none' }}><Phone size={16} style={{ color: 'var(--accent)' }} /> {phone}</a>
            <a href={`mailto:${email}`} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)', textDecoration: 'none' }}><Mail size={16} style={{ color: 'var(--accent)' }} /> {email}</a>
            {businessInfo.tin && <span style={{ fontSize: 13, color: 'var(--muted)' }}>TIN: {businessInfo.tin}</span>}
          </div>
          <Link to="/products" className="noir-btn-primary" style={{ marginTop: 20, padding: '12px 20px', display: 'inline-flex' }}>{t('Shop now')}</Link>
        </div>
        <iframe
          title={t('Map to Blue-Tech')}
          src={`https://maps.google.com/maps?q=${encodeURIComponent(address)}&z=16&output=embed`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          style={{ width: '100%', minHeight: 300, border: '1px solid var(--border)', borderRadius: 16 }}
        />
      </div>
      <style>{`@media (max-width: 720px){ .about-intro, .about-contact { grid-template-columns: 1fr !important } }`}</style>
    </div>
  )
}
