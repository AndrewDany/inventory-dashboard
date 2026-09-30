import jsPDF from 'jspdf'
import samdamLogo from '../assets/landing/samdamlogo.png'

export interface InvoiceLineItem {
  sku: string
  name: string
  quantity: number
  unitPrice: number
  unitLabel?: string
}

export interface InvoiceData {
  invoiceNumber: string
  invoiceCount?: number
  soNumber: string
  customerName?: string
  customerEmail?: string
  customerPhone?: string
  shippingAddress?: string
  processedBy?: string
  paymentStatus: string
  companyName: string
  items: InvoiceLineItem[]
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`))
    img.src = src
  })
}

function imageToPngDataUrl(img: HTMLImageElement): string {
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL('image/png')
}

/**
 * Loads the icon-only mark (public/favicon.svg — just the swirl, no
 * wordmark) and rasterizes it at a higher resolution than its native
 * 48x46 viewBox, so it stays crisp when scaled up large for the
 * background watermark on the invoice.
 */
async function loadWatermarkImage(): Promise<{ dataUrl: string; aspect: number } | null> {
  try {
    const res = await fetch('/favicon.svg')
    const svgText = await res.text()
    const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgText)))}`
    const img = await loadImage(svgDataUrl)
    const scale = 10
    const width = (img.naturalWidth || 48) * scale
    const height = (img.naturalHeight || 46) * scale
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    ctx.drawImage(img, 0, 0, width, height)
    return { dataUrl: canvas.toDataURL('image/png'), aspect: width / height }
  } catch {
    return null
  }
}

export async function generateInvoiceBlob(data: InvoiceData): Promise<string> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 42
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const grandTotal = subtotal
  const issuedAt = new Date()
  const dateText = `${String(issuedAt.getDate()).padStart(2, '0')} ${issuedAt.toLocaleString('en-US', {
    month: 'long',
  })}, ${issuedAt.getFullYear()}`
  const timeText = issuedAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
  const dailyInvoiceNumber = String(data.invoiceCount ?? 1).padStart(3, '0')

  // Logo is embedded as an image so both the header and footer show the
  // real Sam Dam Ventures branding rather than plain text. If it fails to
  // load for any reason, we fall back to the plain-text company name so
  // the invoice still generates instead of throwing.
  let logoDataUrl: string | null = null
  let logoAspect = 1983 / 793
  try {
    const img = await loadImage(samdamLogo)
    logoDataUrl = imageToPngDataUrl(img)
    logoAspect = img.naturalWidth / img.naturalHeight
  } catch {
    logoDataUrl = null
  }

  const watermark = await loadWatermarkImage()

  const footerHeight = 64
  // Navy footer bar, drawn first so all foreground content layers on top.
  const drawFooter = () => {
    doc.setFillColor(21, 24, 59)
    doc.rect(0, pageHeight - footerHeight, pageWidth, footerHeight, 'F')
    if (logoDataUrl) {
      const footerLogoW = 112
      const footerLogoH = footerLogoW / logoAspect
      const footerLogoX = (pageWidth - footerLogoW) / 2
      const footerLogoY = pageHeight - footerHeight + (footerHeight - footerLogoH) / 2
      doc.addImage(logoDataUrl, 'PNG', footerLogoX, footerLogoY, footerLogoW, footerLogoH)
    } else {
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.text('SAM DAM VENTURES', pageWidth / 2, pageHeight - footerHeight / 2 + 5, { align: 'center' })
    }
  }

  doc.setFillColor(250, 250, 250)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  // Faint background watermark of the icon mark, sitting behind all
  // foreground content. Drawn large and mostly off the right edge, at
  // very low opacity, so it reads as a subtle security-paper texture
  // rather than competing with the actual invoice content on top of it.
  if (watermark) {
    const wmWidth = pageWidth * 0.85
    const wmHeight = wmWidth / watermark.aspect
    const wmX = pageWidth - wmWidth * 0.62
    const wmY = (pageHeight - wmHeight) / 2 - 20
    const gState = (doc as unknown as { GState: new (params: { opacity: number }) => unknown }).GState
    try {
      doc.setGState(new gState({ opacity: 0.05 }) as never)
      doc.addImage(watermark.dataUrl, 'PNG', wmX, wmY, wmWidth, wmHeight)
    } finally {
      doc.setGState(new gState({ opacity: 1 }) as never)
    }
  }

  drawFooter()

  // Header logo (top-left)
  if (logoDataUrl) {
    const logoW = 118
    const logoH = logoW / logoAspect
    doc.addImage(logoDataUrl, 'PNG', margin, 26, logoW, logoH)
  } else {
    doc.setTextColor(17, 17, 17)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text((data.companyName || 'YOUR LOGO').toUpperCase(), margin, 48)
  }

  doc.setFontSize(9)
  doc.setTextColor(72, 72, 72)
  doc.setFont('helvetica', 'normal')
  doc.text(`NO. : ${data.invoiceNumber || '000001'}`, pageWidth - margin, 48, { align: 'right' })

  doc.setTextColor(17, 17, 17)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(58)
  doc.text(`INVOICE #${dailyInvoiceNumber}`, margin, 122)

  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('Date:', margin, 156)
  doc.setFont('helvetica', 'normal')
  doc.text(dateText, margin + 38, 156)
  doc.setFont('helvetica', 'bold')
  doc.text('Time:', margin, 173)
  doc.setFont('helvetica', 'normal')
  doc.text(timeText, margin + 38, 173)

  const leftX = margin
  const rightX = pageWidth / 2 + 28
  const contactY = 188

  doc.setFont('helvetica', 'bold')
  doc.text('Bill to', leftX, contactY)
  const billRows = [
    ['Customer Name:', data.customerName || '-'],
    ['Delivery Address:', data.shippingAddress || '-'],
    ['Email:', data.customerEmail || '-'],
    ['Contact:', data.customerPhone || '-'],
  ]
  let billY = contactY + 18
  billRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.text(label, leftX, billY)
    doc.setFont('helvetica', 'normal')
    doc.text(value, leftX + 112, billY)
    billY += 18
  })

  doc.setFont('helvetica', 'bold')
  doc.text('From:', rightX, contactY)
  doc.setFont('helvetica', 'normal')
  const from = [
    data.companyName || 'samdamventures.com',
    'Foster Home Junction, Dodowa Highway',
    'opposite Jehovah Witness Hall',
    'GPS Address: GM-122-9443',
  ]
  let fromY = contactY + 18
  from.forEach((line) => {
    doc.text(line, rightX, fromY)
    fromY += 18
  })

  const tableTop = 286
  const rowHeight = 28
  const colWidths = [220, 78, 78, 78]
  const colStarts = [
    margin,
    margin + colWidths[0],
    margin + colWidths[0] + colWidths[1],
    margin + colWidths[0] + colWidths[1] + colWidths[2],
  ]

  doc.setFillColor(228, 228, 228)
  doc.rect(margin, tableTop, pageWidth - margin * 2, rowHeight, 'F')
  doc.setTextColor(17, 17, 17)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  const headers = ['Item', 'Quantity', 'Price', 'Amount']
  headers.forEach((header, index) => {
    const x = index === 0 ? colStarts[index] + 10 : colStarts[index] + colWidths[index] / 2
    doc.text(header, x, tableTop + 18, index === 0 ? undefined : { align: 'center' })
  })

  const itemRows = data.items.length > 0 ? data.items : [
    { sku: '', name: 'Logo', quantity: 1, unitPrice: 500 },
    { sku: '', name: 'Banner (2x6m)', quantity: 2, unitPrice: 45 },
    { sku: '', name: 'Poster (1x2m)', quantity: 3, unitPrice: 55 },
  ]

  let currentY = tableTop + rowHeight
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  itemRows.forEach((item) => {
    const lineSubtotal = item.quantity * item.unitPrice
    doc.setDrawColor(202, 202, 202)
    doc.line(margin, currentY, pageWidth - margin, currentY)

    doc.text(item.name, colStarts[0] + 10, currentY + 18)
    doc.text(String(item.quantity), colStarts[1] + colWidths[1] / 2, currentY + 18, { align: 'center' })
    doc.text(`GHC ${item.unitPrice.toFixed(2)}`, colStarts[2] + colWidths[2] / 2, currentY + 18, { align: 'center' })
    doc.text(`GHC ${lineSubtotal.toFixed(2)}`, colStarts[3] + colWidths[3] / 2, currentY + 18, { align: 'center' })

    currentY += rowHeight
  })

  const totalsY = currentY + 16
  doc.setDrawColor(160, 160, 160)
  doc.line(margin, totalsY - 6, pageWidth - margin, totalsY - 6)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Total', pageWidth - 128, totalsY + 6)
  doc.text(`GHC ${grandTotal.toFixed(2)}`, pageWidth - margin, totalsY + 6, { align: 'right' })

  const paymentY = totalsY + 46
  doc.setFont('helvetica', 'bold')
  doc.text('Payment method:', margin, paymentY)
  doc.setFont('helvetica', 'normal')
  doc.text(data.paymentStatus || 'Cash', margin + 132, paymentY)

  doc.setFont('helvetica', 'bold')
  doc.text('Note:', margin, paymentY + 20)
  doc.setFont('helvetica', 'normal')
  doc.text('Thank you for choosing us!', margin + 40, paymentY + 20)

  const blob = doc.output('blob')
  return URL.createObjectURL(blob)
}

export async function generateInvoice(data: InvoiceData) {
  const url = await generateInvoiceBlob(data)
  const link = document.createElement('a')
  link.href = url
  link.download = `invoice-${data.invoiceNumber}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}