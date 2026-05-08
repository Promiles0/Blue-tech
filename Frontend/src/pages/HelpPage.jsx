import { useSearchParams } from 'react-router-dom'
import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Reveal } from '../lib/motion'

const SECTIONS = {
  faq: {
    title: 'Frequently Asked Questions',
    content: [
      { q: 'How long does shipping take?', a: 'Standard shipping usually takes 3-5 business days depending on your location.' },
      { q: 'Can I track my order?', a: 'Yes, once your order is shipped, you will receive a tracking number via email.' },
      { q: 'What is your return policy?', a: 'We offer a 30-day return policy for unused products in their original packaging.' },
      { q: 'How do I contact support?', a: 'You can reach us at support@noir.com or through our contact form.' }
    ]
  },
  shipping: {
    title: 'Shipping & Delivery',
    body: `We offer premium shipping to over 20 countries. All orders are carefully packed and shipped from our centralized warehouse.
    
    Standard Shipping: 3–5 business days
    Express Shipping: 1–2 business days
    International: 7–14 business days`
  },
  returns: {
    title: 'Returns & Exchanges',
    body: `If you're not completely satisfied with your purchase, we're here to help. You can return or exchange any item within 30 days of delivery. 
    
    Items must be in original condition and include all packaging. Returns are processed within 5 business days of arrival at our facility.`
  },
  warranty: {
    title: 'Warranty Information',
    body: `Every NOIR product comes with a 2-year limited warranty against manufacturing defects. 
    
    This warranty does not cover accidental damage, wear and tear, or unauthorized modifications. For warranty claims, please contact support@noir.com with your order number.`
  }
}

export default function HelpPage() {
  const [searchParams] = useSearchParams()
  const sectionKey = searchParams.get('v') || 'faq'
  const section = SECTIONS[sectionKey] || SECTIONS.faq

  // Scroll to top whenever the section changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [sectionKey])

  return (
    <div style={{ padding: '80px 0' }}>
      <div className="container-noir" style={{ maxWidth: 800 }}>
        <Reveal>
          <div style={{ marginBottom: 48 }}>
            <h1 style={{ fontSize: 36, fontWeight: 900, marginBottom: 12, letterSpacing: '-0.03em' }}>
              {section.title}
            </h1>
            <div style={{ width: 40, height: 2, background: '#7c5cf0' }} />
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div style={{ color: '#aaa', fontSize: 16, lineHeight: 1.8 }}>
            {section.content ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {section.content.map((item, i) => (
                  <div key={i}>
                    <h3 style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{item.q}</h3>
                    <p>{item.a}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ whiteSpace: 'pre-line' }}>
                {section.body}
              </div>
            )}
          </div>
        </Reveal>

        <div style={{ marginTop: 80, padding: '32px', background: '#111', borderRadius: 16, textAlign: 'center' }}>
          <h4 style={{ color: '#fff', marginBottom: 12 }}>Still have questions?</h4>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>Our team is available Mon–Fri, 9am–5pm EST.</p>
          <a href="mailto:support@noir.com" style={{ color: '#7c5cf0', fontWeight: 600, textDecoration: 'none' }}>
            support@noir.com
          </a>
        </div>
      </div>
    </div>
  )
}
