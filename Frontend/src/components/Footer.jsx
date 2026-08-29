import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { MapPin, Phone, Mail } from 'lucide-react'
import apiService from '../api/service'
import { HELP_LINKS, SUPPORT_EMAIL } from '../lib/helpLinks'

const ACCOUNT_LINKS = [['Profile', '/account'], ['Orders', '/orders'], ['Wishlist', '/wishlist'], ['Sign in', '/login']]

const CAT_LIMIT = 3

export default function Footer() {
  const [showAllCats, setShowAllCats] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const reduce = useReducedMotion()
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await apiService.categories.getAll()
      return Array.isArray(res.data) ? res.data : []
    },
    staleTime: 1000 * 60 * 5,
  })

  const visibleCats = showAllCats ? categories : categories.slice(0, CAT_LIMIT)
  const hasMore = categories.length > CAT_LIMIT

  return (
    <footer style={{ borderTop: '1px solid var(--border)', marginTop: 0, background: 'var(--bg-surface-2)' }}>
      <div className="container-noir" style={{ padding: '60px 24px 0' }}>
        <div className="footer-grid" style={{ marginBottom: 48 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', display: 'block' }} />
              {/* <span style={{ fontFamily: '"Space Grotesk",sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '0.12em' }}>NOIR</span> */}
             <span style={{ fontFamily: '"League Spartan", sans-serif', fontWeight: 800, fontSize: '15px', letterSpacing: '0.12em', color: 'var(--text)' }}>Blue-Tech</span>
                </div>
            <p style={{ color: 'var(--muted-dark)', fontSize: 14, lineHeight: 1.7, maxWidth: 220, marginBottom: 20 }}>
              Considered objects for a quieter, more deliberate digital life.
            </p>
            {/* Contact — collapsed */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, color: 'var(--muted-dark)', fontSize: 13 }}>
              <MapPin size={13} style={{ flexShrink: 0 }} />
              Kigali, Rwanda
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              {[
                { Icon: Phone, href: 'tel:+250788304366', label: 'Call us' },
                { Icon: Mail,  href: `mailto:${SUPPORT_EMAIL}`, label: 'Email us' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  title={label}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: '1px solid var(--border)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--text)', transition: 'color 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border-hover)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border)' }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>

            <button
              onClick={() => setShowDetails(v => !v)}
              style={{
                fontSize: 13, color: 'var(--accent)', background: 'none',
                border: 'none', padding: 0, cursor: 'pointer',
                textAlign: 'left', transition: 'opacity 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {showDetails ? '↑ Hide details' : 'See full details ↓'}
            </button>

            {/* Contact — expanded */}
            <AnimatePresence initial={false}>
              {showDetails && (
                <motion.div
                  key="footer-contact-details"
                  initial={reduce ? false : { height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={reduce ? {} : { height: 0, opacity: 0 }}
                  transition={reduce ? { duration: 0 } : { duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  style={{ overflow: 'hidden' }}
                >
                  <div style={{ paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: 'var(--muted-dark)', fontSize: 13, lineHeight: 1.5 }}>
                      <MapPin size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                      KN59, ST 38, Near Gloria Hotel, Kigali, Rwanda
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <a href="tel:+250788304366" className="story-link" style={{ fontSize: 13, color: 'var(--muted-dark)', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-dark)'}>
                        +250 788 304 366
                      </a>
                      <a href="tel:+250788523788" className="story-link" style={{ fontSize: 13, color: 'var(--muted-dark)', transition: 'color 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-dark)'}>
                        0788 523 788
                      </a>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                      <span className="status-pill status-pill--shipped">Est. 2014</span>
                      <span className="status-pill status-pill--shipped">Dell &amp; HP Partnership</span>
                      <span className="status-pill status-pill--shipped">Bitdefender Partnership</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SHOP column — inline category expand */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 16 }}>SHOP</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/products" className="story-link" style={{ fontSize: 14, color: 'var(--muted-dark)', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-dark)'}>
                All products
              </Link>
              {visibleCats.map(cat => (
                <Link
                  key={cat.categoryId}
                  to={`/products?category=${encodeURIComponent(cat.name ?? '')}`}
                  className="story-link"
                  style={{ fontSize: 14, color: 'var(--muted-dark)', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-dark)'}
                >
                  {cat.name}
                </Link>
              ))}
              {hasMore && (
                <button
                  onClick={() => setShowAllCats(v => !v)}
                  style={{
                    fontSize: 13, color: 'var(--accent)', background: 'none',
                    border: 'none', padding: 0, cursor: 'pointer',
                    textAlign: 'left', marginTop: 2,
                    transition: 'opacity 0.2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  {showAllCats ? '↑ Less' : `+ ${categories.length - CAT_LIMIT} more`}
                </button>
              )}
            </div>
          </div>
          <FooterCol title="ACCOUNT" links={ACCOUNT_LINKS} />
          <FooterCol title="HELP"    links={HELP_LINKS} />
        </div>

<div style={{
          borderTop: '1px solid var(--border)', padding: '20px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{ color: 'var(--muted-dark)', fontSize: 13 }}>© 2026 Blue-Tech. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['Privacy', '#'], ['Terms', '#'], ['Cookies', '#']].map(([label, href]) => (
              <a
                key={label}
                href={href}
                style={{ fontSize: 13, color: 'var(--muted-dark)', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--muted)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-dark)'}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: 'var(--muted)', marginBottom: 16 }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map(([label, to]) => (
          <Link
            key={label}
            to={to}
            className="story-link"
            style={{ fontSize: 14, color: 'var(--muted-dark)', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted-dark)'}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
