import { Link } from 'react-router-dom'

const SHOP_LINKS    = [['All products', '/products'], ['Audio', '/products?category=Audio'], ['Wearables', '/products?category=Wearables'], ['Cameras', '/products?category=Cameras']]
const ACCOUNT_LINKS = [['Profile', '/account'], ['Orders', '/account'], ['Wishlist', '/wishlist'], ['Sign in', '/login']]
const COMPANY_LINKS = [['About', '#'], ['Press', '#'], ['Contact', '#'], ['Sustainability', '#']]

export default function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #1a1a1a', marginTop: 80 }}>
      <div className="container-noir" style={{ padding: '60px 24px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: '48px 32px', marginBottom: 48 }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#7c5cf0', display: 'block' }} />
              <span style={{ fontWeight: 800, fontSize: 15, letterSpacing: '0.12em', color: '#fff' }}>NOIR</span>
            </div>
            <p style={{ color: '#888', fontSize: 14, lineHeight: 1.7, maxWidth: 220 }}>
              Considered objects for a quieter, more deliberate digital life.
            </p>
          </div>

          <FooterCol title="SHOP"    links={SHOP_LINKS} />
          <FooterCol title="ACCOUNT" links={ACCOUNT_LINKS} />
          <FooterCol title="COMPANY" links={COMPANY_LINKS} />
        </div>

        <div style={{ borderTop: '1px solid #1a1a1a', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <p style={{ color: '#555', fontSize: 13 }}>© 2026 NOIR Studio. All rights reserved.</p>
          <p style={{ color: '#555', fontSize: 13 }}>Crafted with deliberate care.</p>
        </div>
      </div>
    </footer>
  )
}

function FooterCol({ title, links }) {
  return (
    <div>
      <h4 style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', color: '#555', marginBottom: 16 }}>{title}</h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {links.map(([label, to]) => (
          <Link
            key={label}
            to={to}
            style={{ fontSize: 14, color: '#888', transition: 'color 0.2s' }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = '#888'}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  )
}
