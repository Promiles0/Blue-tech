import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import QuoteRequestModal from './QuoteRequestModal'
import { CONFIGS } from './InteractiveScreensConfigurations'
import { onQuoteOpen } from '../../lib/quote'

const SIZES = CONFIGS.map((c) => c.size)

// The page's single quote form. Every "Get a quote" button calls openQuote(); arriving
// with ?quote=1 (optionally &size=86) — e.g. from the AI assistant — opens it straight away.
export default function InteractiveScreensQuote() {
  const [params, setParams] = useSearchParams()
  const [open, setOpen] = useState(false)
  const [prefill, setPrefill] = useState({})

  useEffect(() => onQuoteOpen((detail) => {
    setPrefill(detail)
    setOpen(true)
  }), [])

  useEffect(() => {
    if (params.get('quote') !== '1') return
    const size = params.get('size')
    setPrefill({ screenSize: size && SIZES.includes(`${size}"`) ? `${size}"` : '86"' })
    setOpen(true)
    params.delete('quote')
    params.delete('size')
    setParams(params, { replace: true })
  }, [params, setParams])

  return (
    <QuoteRequestModal
      open={open}
      onClose={() => setOpen(false)}
      prefill={{ screenSize: '86"', ...prefill }}
      sizes={SIZES}
    />
  )
}
