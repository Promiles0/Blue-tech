import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import { toast } from 'sonner'
import apiService from '../../api/service'
import { useAuth } from '../../context/AuthContext'

// Spreadsheets (7c): download products and orders as CSV (opens in Excel / Google Sheets),
// and update prices and stock from a CSV — with a preview of every change before saving.
async function download(promise, fallbackName) {
  try {
    const res = await promise
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/csv;charset=utf-8' })
    const name = /filename="([^"]+)"/.exec(res.headers?.['content-disposition'] ?? '')?.[1] ?? fallbackName
    const url = URL.createObjectURL(blob)
    Object.assign(document.createElement('a'), { href: url, download: name }).click()
    URL.revokeObjectURL(url)
  } catch {
    toast.error('Could not download the file')
  }
}

const today = () => new Date().toISOString().slice(0, 10)
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString().slice(0, 10)
const card = { borderRadius: 14, padding: '20px 22px', marginBottom: 18 }
const btn = { display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 9, border: 0, background: 'var(--admin-primary)', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }
const input = { padding: '7px 10px', borderRadius: 8, border: '1px solid var(--admin-border)', background: 'transparent', color: 'var(--text)', fontSize: 13 }

export default function AdminSpreadsheets() {
  const { isAdmin } = useAuth()
  const [from, setFrom] = useState(daysAgo(30))
  const [to, setTo] = useState(today())
  const [csv, setCsv] = useState('')
  const [fileName, setFileName] = useState('')
  const [preview, setPreview] = useState(null)
  const [busy, setBusy] = useState(false)
  const fileRef = useRef(null)

  const pick = async (file) => {
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { toast.error('Max 2 MB'); return }
    const text = await file.text()
    setCsv(text); setFileName(file.name); setBusy(true)
    try {
      const { data } = await apiService.admin.spreadsheets.preview(text)
      setPreview(data)
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not read the file'); setPreview(null)
    } finally { setBusy(false) }
  }

  const apply = async () => {
    setBusy(true)
    try {
      const { data } = await apiService.admin.spreadsheets.apply(csv)
      toast.success(`${data?.applied ?? 0} change(s) saved`)
      setPreview(null); setCsv(''); setFileName('')
    } catch (err) {
      toast.error(err.response?.data?.message ?? 'Could not save the changes')
    } finally { setBusy(false) }
  }

  return (
    <div style={{ padding: 40, maxWidth: 900 }}>
      <h1 style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
        <FileSpreadsheet size={22} style={{ color: 'var(--admin-primary)' }} /> Spreadsheets
      </h1>
      <p style={{ color: 'var(--admin-muted)', fontSize: 13, margin: '4px 0 20px', lineHeight: 1.6 }}>CSV files open in Excel and Google Sheets.</p>

      <div className="surface" style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>Products</h2>
        <p style={{ fontSize: 12.5, color: 'var(--admin-muted)', margin: '0 0 12px' }}>Every product option with SKU, price, stock and status — also the template for updating prices and stock below.</p>
        <button style={btn} onClick={() => download(apiService.admin.spreadsheets.exportProducts(), `blue-tech-products-${today()}.csv`)}><Download size={14} /> Download products</button>
      </div>

      <div className="surface" style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>Orders</h2>
        <p style={{ fontSize: 12.5, color: 'var(--admin-muted)', margin: '0 0 12px' }}>For your accountant: date, status, payment, totals, customer and items, for the period you choose.</p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: 13 }}>From <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={input} /></label>
          <label style={{ fontSize: 13 }}>To <input type="date" value={to} onChange={e => setTo(e.target.value)} style={input} /></label>
          <button style={btn} onClick={() => download(apiService.admin.spreadsheets.exportOrders(from, to), `blue-tech-orders-${from}-to-${to}.csv`)}><Download size={14} /> Download orders</button>
        </div>
      </div>

      <div className="surface" style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 6px' }}>Update prices and stock from a file</h2>
        {!isAdmin ? (
          <p style={{ fontSize: 13, color: 'var(--admin-muted)', margin: 0 }}>Only an admin can import price changes.</p>
        ) : (
          <>
            <p style={{ fontSize: 12.5, color: 'var(--admin-muted)', margin: '0 0 12px', lineHeight: 1.6 }}>
              Download the products file, change <strong>price_rwf</strong> and/or <strong>stock</strong>, and upload it here. Rows are matched by SKU;
              only existing products change — nothing is created or deleted. You'll see every change before it's saved.
            </p>
            <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={e => { pick(e.target.files?.[0]); e.target.value = '' }} />
            <button style={{ ...btn, background: 'transparent', color: 'var(--text)', border: '1px solid var(--admin-border)' }} onClick={() => fileRef.current?.click()} disabled={busy}>
              <Upload size={14} /> {fileName ? `Choose another file (${fileName})` : 'Choose CSV file'}
            </button>

            {preview && (
              <div style={{ marginTop: 16 }}>
                {preview.errors?.length > 0 && (
                  <div style={{ fontSize: 12.5, color: 'var(--admin-warning)', marginBottom: 12 }}>
                    {preview.errors.slice(0, 20).map((e, i) => <div key={i}>⚠ {e}</div>)}
                    {preview.errors.length > 20 && <div>…and {preview.errors.length - 20} more</div>}
                  </div>
                )}
                {!preview.changes?.length ? (
                  <p style={{ fontSize: 13, color: 'var(--admin-muted)' }}>No changes found — the file matches what's in the shop.</p>
                ) : (
                  <>
                    <div style={{ maxHeight: 340, overflowY: 'auto', border: '1px solid var(--admin-border)', borderRadius: 10 }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                        <thead><tr style={{ textAlign: 'left', color: 'var(--admin-muted)' }}>{['Product', 'Change', 'From', 'To'].map(h => <th key={h} style={{ padding: '8px 12px' }}>{h}</th>)}</tr></thead>
                        <tbody>
                          {preview.changes.map((c, i) => (
                            <tr key={i} style={{ borderTop: '1px solid var(--admin-border)' }}>
                              <td style={{ padding: '7px 12px' }}>{c.name}{c.sku ? <span style={{ color: 'var(--admin-muted)' }}> · {c.sku}</span> : null}</td>
                              <td style={{ padding: '7px 12px' }}>{c.kind === 'price' ? 'Price' : 'Stock'}</td>
                              <td style={{ padding: '7px 12px' }}>{c.kind === 'price' ? `${Math.round(c.from).toLocaleString('en-US')} RWF` : c.from}</td>
                              <td style={{ padding: '7px 12px', fontWeight: 700 }}>{c.kind === 'price' ? `${Math.round(c.to).toLocaleString('en-US')} RWF` : c.to}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <button style={{ ...btn, marginTop: 12 }} onClick={apply} disabled={busy}>{busy ? 'Saving…' : `Save ${preview.changes.length} change${preview.changes.length === 1 ? '' : 's'}`}</button>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
