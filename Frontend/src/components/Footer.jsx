import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Globe, Mail, ExternalLink } from 'lucide-react'
import apiService from '../api/service'

const ACCOUNT_LINKS = [['Profile', '/account'], ['Orders', '/orders'], ['Wishlist', '/wishlist'], ['Sign in', '/login']]
const HELP_LINKS    = [['FAQ', '/help?v=faq'], ['Shipping', '/help?v=shipping'], ['Returns', '/help?v=returns'], ['Warranty', '/help?v=warranty']]

const CAT_LIMIT = 3

export default function Footer() {
  const [showAllCats, setShowAllCats] = useState(false)
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
    <footer style={{ borderTop: '1px solid #141414', marginTop: 0 }}>
      <div className="container-noir" style={{ padding: '60px 24px 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '2fr 1fr 1fr 1fr',
          gap: '48px 32px',
          marginBottom: 48,
        }}
          className="footer-grid"
        >
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c5cf0', display: 'block' }} />
              <span style={{ fontFamily: '"Space Grotesk",sans-serif', fontWeight: 800, fontSize: 15, letterSpacing: '0.12em' }}>NOIR</span>
            </div>
            <p style={{ color: '#555', fontSize: 14, lineHeight: 1.7, maxWidth: 220, marginBottom: 20 }}>
              Considered objects for a quieter, more deliberate digital life.
            </p>
            {/* Social */}
            <div style={{ display: 'flex', gap: 12 }}>
              {[
                { Icon: Globe,        href: '#', label: 'website' },
                { Icon: Mail,         href: '#', label: 'email' },
                { Icon: ExternalLink, href: '#', label: 'social' },
              ].map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  style={{
                    width: 32, height: 32, borderRadius: 8,
                    border: '1px solid #1e1e1e',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: '#555', transition: 'color 0.2s, border-color 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderColor = '#2e2e2e' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#1e1e1e' }}
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>
          </div>

          {/* SHOP column — inline category expand */}
          <div>
            <h4 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: '#333', marginBottom: 16 }}>SHOP</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Link to="/products" className="story-link" style={{ fontSize: 14, color: '#555', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                onMouseLeave={e => e.currentTarget.style.color = '#555'}>
                All products
              </Link>
              {visibleCats.map(cat => (
                <Link
                  key={cat.categoryId}
                  to={`/products?category=${encodeURIComponent(cat.name ?? '')}`}
                  className="story-link"
                  style={{ fontSize: 14, color: '#555', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                  onMouseLeave={e => e.currentTarget.style.color = '#555'}
                >
                  {cat.name}
                </Link>
              ))}
              {hasMore && (
                <button
                  onClick={() => setShowAllCats(v => !v)}
                  style={{
                    fontSize: 13, color: '#7c5cf0', background: 'none',
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
          borderTop: '1px solid #141414', padding: '20px 0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexWrap: 'wrap', gap: 12,
        }}>
          <p style={{ color: '#333', fontSize: 13 }}>© 2026 NOIR Studio. All rights reserved.</p>
          <div style={{ display: 'flex', gap: 20 }}>
            {[['Privacy', '#'], ['Terms', '#'], ['Cookies', '#']].map(([label, href]) => (
              <a
                key={label}
                href={href}
                style={{ fontSize: 13, color: '#333', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#888'}
                onMouseLeave={e => e.currentTarget.style.color = '#333'}
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
      <h4 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: '#333', marginBottom: 16 }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map(([label, to]) => (
          <Link
            key={label}
            to={to}
            className="story-link"
            style={{ fontSize: 14, color: '#555', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#555'}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
