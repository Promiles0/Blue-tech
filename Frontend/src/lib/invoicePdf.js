// Proforma invoices (from the cart) and order invoices as downloadable PDFs.
// jsPDF is imported on demand, so it never weighs on normal page loads.

const rwf = (n) => `${Math.round(Number(n) || 0).toLocaleString('en-US')} RWF`
const day = (d) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

// VAT split for a gross amount — mirrors vatSplit() in the API.
export function vatSplit(amount, mode, rate) {
  if (mode === 'included') { const vat = amount - amount / (1 + rate / 100); return { subtotal: amount - vat, vat, total: amount } }
  if (mode === 'added') { const vat = amount * rate / 100; return { subtotal: amount, vat, total: amount + vat } }
  return { subtotal: amount, vat: 0, total: amount }
}

/**
 * @param {object} doc
 *   kind: 'PROFORMA INVOICE' | 'INVOICE'
 *   number, date, validUntil?, business, customer {organization, name, tin, phone, email, address},
 *   items [{ name, sku, option, quantity, unitPrice, lineTotal }],
 *   totals [{ label, amount, strong? }], footnote?
 */
// With { returnBlob: true } the PDF is returned instead of downloaded (previews, tests).
export async function downloadInvoicePdf(doc, { returnBlob = false } = {}) {
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')])
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const W = pdf.internal.pageSize.getWidth()
  const NAVY = [53, 67, 128]
  const b = doc.business ?? {}

  // Header band
  pdf.setFillColor(...NAVY)
  pdf.rect(0, 0, W, 28, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold').setFontSize(18).text(b.legalName || 'Blue-Tech', 14, 17)
  pdf.setFontSize(13).text(doc.kind, W - 14, 13, { align: 'right' })
  pdf.setFont('helvetica', 'normal').setFontSize(10).text(doc.number, W - 14, 20, { align: 'right' })

  // Seller / buyer blocks
  pdf.setTextColor(30, 30, 30)
  let y = 38
  const seller = [b.address, b.phone, b.email, b.tin ? `TIN: ${b.tin}` : null].filter(Boolean)
  pdf.setFont('helvetica', 'bold').setFontSize(9).text('FROM', 14, y)
  pdf.setFont('helvetica', 'normal').setFontSize(10)
  seller.forEach((line, i) => pdf.text(String(line), 14, y + 5 + i * 5))

  const c = doc.customer ?? {}
  const buyer = [c.organization, c.name, c.address, c.phone, c.email, c.tin ? `TIN: ${c.tin}` : null].filter(Boolean)
  const x2 = W / 2 + 4
  pdf.setFont('helvetica', 'bold').setFontSize(9).text('BILL TO', x2, y)
  pdf.setFont('helvetica', 'normal').setFontSize(10)
  buyer.forEach((line, i) => pdf.text(pdf.splitTextToSize(String(line), W / 2 - 18)[0], x2, y + 5 + i * 5))

  y += 8 + Math.max(seller.length, buyer.length) * 5
  pdf.setFontSize(10)
  pdf.text(`Date: ${day(doc.date)}`, 14, y)
  if (doc.validUntil) pdf.text(`Valid until: ${day(doc.validUntil)}`, 70, y)

  autoTable(pdf, {
    startY: y + 5,
    head: [['#', 'Item', 'Qty', 'Unit price', 'Amount']],
    body: doc.items.map((it, i) => [
      i + 1,
      [it.name, [it.option && it.option !== 'Default' ? it.option : null, it.sku].filter(Boolean).join(' · ')].filter(Boolean).join('\n'),
      it.quantity,
      rwf(it.unitPrice),
      rwf(it.lineTotal),
    ]),
    theme: 'grid',
    headStyles: { fillColor: NAVY, textColor: 255, fontStyle: 'bold' },
    styles: { fontSize: 9.5, cellPadding: 2.5, lineColor: [220, 222, 230] },
    columnStyles: { 0: { cellWidth: 9 }, 2: { halign: 'center', cellWidth: 14 }, 3: { halign: 'right', cellWidth: 32 }, 4: { halign: 'right', cellWidth: 34 } },
  })

  y = pdf.lastAutoTable.finalY + 6
  doc.totals.forEach(t => {
    pdf.setFont('helvetica', t.strong ? 'bold' : 'normal').setFontSize(t.strong ? 12 : 10)
    pdf.text(t.label, W - 52, y, { align: 'right' })
    pdf.text(rwf(t.amount), W - 14, y, { align: 'right' })
    y += t.strong ? 7 : 5.5
  })

  y += 4
  pdf.setFont('helvetica', 'normal').setFontSize(9).setTextColor(90, 90, 90)
  if (b.paymentDetails) {
    pdf.setFont('helvetica', 'bold').text('Payment details', 14, y)
    pdf.setFont('helvetica', 'normal')
    const lines = pdf.splitTextToSize(b.paymentDetails, W - 28)
    pdf.text(lines, 14, y + 4.5)
    y += 6 + lines.length * 4.5
  }
  const notes = [doc.footnote, 'This document is not an EBM receipt. An official EBM receipt is issued on payment.'].filter(Boolean)
  pdf.text(pdf.splitTextToSize(notes.join(' '), W - 28), 14, Math.max(y, 270))

  if (returnBlob) return pdf.output('blob')
  pdf.save(`${doc.number}.pdf`)
}

// Order invoice from an order detail (My orders / admin), using the current business settings.
export function orderInvoiceDoc(order, business, customerName) {
  const items = (order.items ?? []).map(it => ({
    name: it.productName, option: it.variantInfo, quantity: it.quantity,
    unitPrice: it.priceAtPurchase, lineTotal: it.subtotal,
  }))
  const itemsTotal = items.reduce((s, i) => s + (Number(i.lineTotal) || 0), 0)
  const shipping = Number(order.shippingFee) || 0
  const total = Number(order.totalAmount) || 0
  const discount = Math.max(0, Math.round(itemsTotal + shipping - total))
  const split = vatSplit(total, business?.vatMode, Number(business?.vatRate) || 0)
  const totals = [{ label: 'Items', amount: itemsTotal }]
  if (shipping) totals.push({ label: 'Delivery', amount: shipping })
  if (discount) totals.push({ label: 'Discount', amount: -discount })
  if (business?.vatMode === 'included') totals.push({ label: `incl. VAT ${business.vatRate}%`, amount: split.vat })
  if (business?.vatMode === 'added') totals.push({ label: `VAT ${business.vatRate}%`, amount: split.vat })
  totals.push({ label: 'Total', amount: business?.vatMode === 'added' ? split.total : total, strong: true })
  return {
    kind: 'INVOICE',
    number: `INV-${String(order.orderId).padStart(6, '0')}`,
    date: order.createdAt,
    business,
    customer: {
      name: order.shippingRecipient || customerName,
      address: [order.shippingStreet, order.shippingCity, order.shippingCountry].filter(Boolean).join(', '),
      phone: order.shippingPhoneNumber,
    },
    items,
    totals,
    footnote: `Payment: ${String(order.paymentMethod ?? '').replace('_', ' ')} · Status: ${order.status}.`,
  }
}

// Proforma doc from the API's proforma result.
export function proformaDoc(p, business) {
  const totals = [{ label: 'Subtotal', amount: p.subtotal }]
  if (business?.vatMode !== 'none' && p.vat) totals.push({ label: business.vatMode === 'included' ? `incl. VAT ${business.vatRate}%` : `VAT ${business.vatRate}%`, amount: p.vat })
  totals.push({ label: 'Total', amount: p.total, strong: true })
  return {
    kind: 'PROFORMA INVOICE',
    number: p.number,
    date: p.createdAt,
    validUntil: p.validUntil,
    business,
    customer: { organization: p.organization, name: p.contactName, tin: p.tin, phone: p.phone, email: p.email },
    items: (p.items ?? []).map(i => ({ ...i })),
    totals,
    footnote: 'Prices and availability are confirmed for the validity period above. Delivery is free anywhere in Rwanda.',
  }
}
