import { Reveal } from '../../lib/motion'
import { useInteractiveScreensProducts } from '../../hooks/useInteractiveScreensProducts'
import { useCurrency } from '../../context/CurrencyContext'

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }
const heading = { fontFamily: '"Space Grotesk",sans-serif', fontSize: 'clamp(24px,3vw,32px)', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text)' }

const SPEC_ROWS = [
  ['Screen size', p => p.screenSize],
  ['Resolution', p => p.resolution],
  ['Touch', p => p.touchPoints != null ? `${p.touchPoints}-point` : null],
  ['OS', p => p.os],
  ['Connectivity', p => p.connectivity],
  ['Warranty', p => p.warranty],
  ['Price', (p, formatPrice) => p.price != null ? formatPrice(p.price) : null],
]

// Sourced from the same real product data as the Models grid above it — not another
// hardcoded fictional array — via the shared useInteractiveScreensProducts hook. Renders
// nothing until real products (with real category assignment) exist, since an empty
// comparison table reads as more broken than a hidden section.
export default function InteractiveScreensComparison() {
  const { formatPrice } = useCurrency()
  const { products, isLoading } = useInteractiveScreensProducts()

  if (isLoading || products.length === 0) return null

  return (
    <section style={{ padding: 'clamp(56px,8vw,100px) 0' }}>
      <div className="container-noir">
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <p style={eyebrow}>Compare models</p>
          <h2 style={heading}>See the specs side by side.</h2>
        </div>

        <Reveal>
          <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 16 }}>
            <table style={{ width: '100%', minWidth: 480, borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{ ...headCellStyle, textAlign: 'left' }} />
                  {products.map(p => (
                    <th key={p.productId ?? p.id} style={headCellStyle}>
                      {p.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {SPEC_ROWS.map(([label, getValue], i) => (
                  <tr key={label} style={{ background: i % 2 === 1 ? 'var(--surface)' : 'transparent' }}>
                    <th scope="row" style={rowLabelStyle}>{label}</th>
                    {products.map(p => (
                      <td key={p.productId ?? p.id} style={cellStyle}>
                        {getValue(p, formatPrice) ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

const headCellStyle = {
  padding: '14px 18px', textAlign: 'center', fontWeight: 700, fontSize: 13,
  color: 'var(--text)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap',
}
const rowLabelStyle = {
  padding: '12px 18px', textAlign: 'left', fontWeight: 600, fontSize: 12.5,
  color: 'var(--muted)', whiteSpace: 'nowrap',
}
const cellStyle = {
  padding: '12px 18px', textAlign: 'center', color: 'var(--text)', whiteSpace: 'nowrap',
}
