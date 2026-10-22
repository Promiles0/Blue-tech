import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowRight, Tag } from 'lucide-react'
import { Reveal } from '../lib/motion'
import apiService from '../api/service'
import ProductCard from '../components/ProductCard'
import { SaleCountdown } from '../components/site/SaleBits'
import { usePageMeta } from '../hooks/usePageMeta'
import { useT } from '../lib/i18n'

// A sale campaign's own page (6b): /sale/<slug>, everything in it at the sale price.
export default function SalePage() {
  const { slug } = useParams()
  const { t, intlLocale } = useT()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['campaign', slug],
    queryFn: () => apiService.campaigns.get(slug).then((r) => r.data),
    retry: false,
  })
  const campaign = data?.campaign
  const products = data?.products ?? []
  usePageMeta({
    title: `${campaign?.name ?? t('Sale')} | Blue-Tech`,
    description: campaign?.bannerText ?? (campaign ? t('{name} — sale prices on {n} products at Blue-Tech, until {date}.', { name: campaign.name, n: products.length, date: new Date(campaign.endsAt).toLocaleDateString(intlLocale) }) : undefined),
  })

  return (
    <div style={{ padding: '64px 0 80px' }}>
      <div className="container-noir">
        {isError ? (
          <div style={{ maxWidth: 560 }}>
            <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 30, fontWeight: 900, color: 'var(--text)', marginBottom: 12 }}>{t('This sale has ended')}</h1>
            <p style={{ color: 'var(--muted)', marginBottom: 20 }}>{t('Prices are back to normal, but there is plenty to browse.')}</p>
            <Link to="/products" className="noir-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{t('Browse all products')} <ArrowRight size={15} /></Link>
          </div>
        ) : (
          <>
            <Reveal>
              <div style={{ maxWidth: 720 }}>
                <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--danger, #ef4444)', marginBottom: 12, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Tag size={13} /> {t('Sale')} {campaign && `· ${campaign.kind === 'percent' ? `-${campaign.value}%` : ''}`}
                </p>
                <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 12 }}>
                  {campaign?.name ?? ' '}
                </h1>
                {campaign?.bannerText && <p style={{ fontSize: 16, color: 'var(--muted)', lineHeight: 1.65, marginBottom: 10 }}>{campaign.bannerText}</p>}
                {campaign && <SaleCountdown endsAt={campaign.endsAt} />}
              </div>
            </Reveal>
            <section style={{ marginTop: 40 }}>
              {isLoading ? (
                <div className="grid-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton card-skeleton" />)}</div>
              ) : products.length ? (
                <div className="grid-4">
                  {products.map((p, i) => (
                    <Reveal key={p.productId ?? p.id} delay={Math.min(i * 0.04, 0.24)}><ProductCard product={p} /></Reveal>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--muted)' }}>{t('Nothing in this sale right now.')}</p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  )
}
