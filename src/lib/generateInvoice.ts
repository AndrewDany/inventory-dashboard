import jsPDF from 'jspdf'
import samdamLogoUrl from '../assets/landing/samdamlogo.png'
import { parseUtcTimestamp } from './relativeTime'

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
  paymentStatus?: string
  companyName?: string
  items: InvoiceLineItem[]
  logoDataUrl?: string
  note?: string
  issuedAt?: string
  paperSize?: 'pos'
}

let cachedLogoDataUrl: string | null = null

export function getLogoDataUrl(): Promise<string | null> {
  if (cachedLogoDataUrl) return Promise.resolve(cachedLogoDataUrl)
  if (typeof window === 'undefined') return Promise.resolve(null)

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'Anonymous'
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const sourceWidth = img.naturalWidth || img.width
        const sourceHeight = img.naturalHeight || img.height
        const scale = Math.min(1, 512 / sourceWidth)
        canvas.width = Math.round(sourceWidth * scale)
        canvas.height = Math.round(sourceHeight * scale)
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          cachedLogoDataUrl = canvas.toDataURL('image/png')
          resolve(cachedLogoDataUrl)
          return
        }
      } catch {
        // ignore canvas error
      }
      resolve(null)
    }
    img.onerror = () => resolve(null)
    img.src = samdamLogoUrl
  })
}

// Preload logo in browser environment
if (typeof window !== 'undefined') {
  getLogoDataUrl()
}

/**
 * Loads the icon-only mark (public/favicon.svg — just the swirl, no
 * wordmark) and rasterizes it at a higher resolution than its native
 * 48x46 viewBox, so it stays crisp when scaled up large for the
 * background watermark on the invoice.
 */
let cachedWatermark: { dataUrl: string; aspect: number } | null = null
let watermarkPromise: Promise<{ dataUrl: string; aspect: number } | null> | null = null

function loadWatermarkImage(): Promise<{ dataUrl: string; aspect: number } | null> {
  if (cachedWatermark) return Promise.resolve(cachedWatermark)
  if (!watermarkPromise) {
    watermarkPromise = (async () => {
      try {
        const res = await fetch('/favicon.svg')
        const svgText = await res.text()
        const svgDataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgText)))}`
        const img: HTMLImageElement = await new Promise((resolve, reject) => {
          const el = new Image()
          el.onload = () => resolve(el)
          el.onerror = () => reject(new Error('Failed to load watermark image'))
          el.src = svgDataUrl
        })
        const scale = 10
        const width = (img.naturalWidth || 48) * scale
        const height = (img.naturalHeight || 46) * scale
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas 2D context unavailable')
        ctx.drawImage(img, 0, 0, width, height)
        cachedWatermark = { dataUrl: canvas.toDataURL('image/png'), aspect: width / height }
        return cachedWatermark
      } catch {
        return null
      }
    })()
  }
  return watermarkPromise
}

if (typeof window !== 'undefined') {
  void loadWatermarkImage()
}

const invoiceBlobCache = new Map<string, Blob>()
const invoiceBlobPromises = new Map<string, Promise<Blob>>()
const MAX_CACHED_INVOICES = 8

export function prepareInvoiceBlob(data: InvoiceData): Promise<Blob> {
  const key = JSON.stringify(data)
  const cached = invoiceBlobCache.get(key)
  if (cached) {
    invoiceBlobCache.delete(key)
    invoiceBlobCache.set(key, cached)
    return Promise.resolve(cached)
  }

  const pending = invoiceBlobPromises.get(key)
  if (pending) return pending

  const generation = renderInvoiceBlob(data)
  invoiceBlobPromises.set(key, generation)
  void generation.then((blob) => {
    invoiceBlobCache.set(key, blob)
    while (invoiceBlobCache.size > MAX_CACHED_INVOICES) {
      const oldestKey = invoiceBlobCache.keys().next().value
      if (oldestKey === undefined) break
      invoiceBlobCache.delete(oldestKey)
    }
  }).catch(() => {}).finally(() => invoiceBlobPromises.delete(key))
  return generation
}

export function preloadInvoiceBlob(data: InvoiceData): void {
  void prepareInvoiceBlob(data).catch(() => {})
}

export async function generateInvoiceBlob(data: InvoiceData): Promise<string> {
  return URL.createObjectURL(await prepareInvoiceBlob(data))
}

async function renderInvoiceBlob(data: InvoiceData): Promise<Blob> {
  if (data.paperSize === 'pos') {
    const logoData = data.logoDataUrl || cachedLogoDataUrl || (await getLogoDataUrl())
    return renderPosReceiptBlob(data, logoData)
  }

  const [logoData, watermark] = await Promise.all([
    data.logoDataUrl ? Promise.resolve(data.logoDataUrl) : getLogoDataUrl(),
    loadWatermarkImage(),
  ])

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth() // 595.28
  const pageHeight = doc.internal.pageSize.getHeight() // 841.89
  const margin = 42
  const usableWidth = pageWidth - margin * 2 // 511.28

  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const grandTotal = subtotal
  const issuedAt = data.issuedAt ? parseUtcTimestamp(data.issuedAt) : new Date()
  const dateText = `${String(issuedAt.getDate()).padStart(2, '0')} ${issuedAt.toLocaleString('en-US', {
    month: 'long',
  })}, ${issuedAt.getFullYear()}`
  const timeText = issuedAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  // Format invoice daily count as e.g. #003
  const dailyInvoiceNumber = String(data.invoiceCount ?? 1).padStart(3, '0')

  // Background - Clean White
  doc.setFillColor(255, 255, 255)
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

  // Top Left Logo Image
  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', margin, 36, 160, 48)
    } catch {
      drawFallbackHeaderLogo(doc, margin, 36)
    }
  } else {
    drawFallbackHeaderLogo(doc, margin, 36)
  }

  // Invoice Title & SO Reference Number
  const titleY = 120
  doc.setTextColor(15, 23, 42) // #0F172A (dark navy)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(34)
  doc.text(`INVOICE #${dailyInvoiceNumber}`, margin, titleY)

  doc.setFontSize(8.5)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(71, 85, 105) // #475569
  doc.text(`NO. : ${data.soNumber || data.invoiceNumber || 'POS-FSC15D'}`, pageWidth - margin, titleY - 6, {
    align: 'right',
  })

  // Divider line below header
  const divider1Y = 136
  doc.setDrawColor(226, 232, 240) // #E2E8F0
  doc.setLineWidth(0.75)
  doc.line(margin, divider1Y, pageWidth - margin, divider1Y)

  // Two-column Metadata
  const metaY = 158
  const rightColX = 330

  // Left Column (Date & Bill To)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('Date:', margin, metaY)
  doc.setFont('helvetica', 'bold')
  doc.text(dateText, margin + 34, metaY)

  doc.setFont('helvetica', 'bold')
  doc.text('Time:', margin, metaY + 16)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(51, 65, 85)
  doc.text(timeText, margin + 34, metaY + 16)

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text('Bill to:', margin, metaY + 36)

  const billRows = [
    ['Customer name:', data.customerName || 'N/A'],
    ['Delivery Address:', data.shippingAddress || 'N/A'],
    ['Email:', data.customerEmail || 'N/A'],
    ['Contact:', formatGhanaPhone(data.customerPhone)],
  ]

  let billY = metaY + 52
  billRows.forEach(([label, value]) => {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.setTextColor(15, 23, 42)
    doc.text(label, margin, billY)

    doc.setFont('helvetica', 'normal')
    doc.setTextColor(51, 65, 85)
    doc.text(value, margin + 102, billY)
    billY += 16
  })

  // Right Column (From)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text('From:', rightColX, metaY)

  const fromLines = [
    data.companyName || 'samdamventures.com',
    'Foster Home Junction, Dodowa Highway',
    'opposite Jehovah Witness Hall',
    'GPS Address: GM-122-9443',
  ]

  let fromY = metaY + 16
  fromLines.forEach((line) => {
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(51, 65, 85)
    doc.text(line, rightColX, fromY)
    fromY += 16
  })

  // Table Section
  const tableTop = 276
  const headerHeight = 24

  // Light gray table header background
  doc.setFillColor(241, 245, 249) // #F1F5F9
  doc.rect(margin, tableTop, usableWidth, headerHeight, 'F')

  const col1X = margin + 12 // Item
  const col2X = 330 // Quantity
  const col3X = 420 // Price
  const col4X = pageWidth - margin - 12 // Amount

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text('Item', col1X, tableTop + 16)
  doc.text('Quantity', col2X, tableTop + 16, { align: 'center' })
  doc.text('Price', col3X, tableTop + 16, { align: 'right' })
  doc.text('Amount', col4X, tableTop + 16, { align: 'right' })

  const itemsList =
    data.items.length > 0
      ? data.items
      : [{ sku: 'SKU-001', name: 'Claw Hammer 16oz', quantity: 1, unitPrice: 15 }]

  let rowY = tableTop + headerHeight
  const rowHeight = 28

  itemsList.forEach((item) => {
    rowY += rowHeight
    const itemSubtotal = item.quantity * item.unitPrice

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9.5)
    doc.setTextColor(30, 41, 59)

    doc.text(item.name, col1X, rowY - 8)
    doc.text(String(item.quantity), col2X, rowY - 8, { align: 'center' })
    doc.text(`GHC ${item.unitPrice.toFixed(2)}`, col3X, rowY - 8, { align: 'right' })
    doc.text(`GHC ${itemSubtotal.toFixed(2)}`, col4X, rowY - 8, { align: 'right' })

    // Bottom row border line
    doc.setDrawColor(241, 245, 249)
    doc.setLineWidth(0.5)
    doc.line(margin, rowY, pageWidth - margin, rowY)
  })

  // Grand Total
  const totalsY = rowY + 28
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(13)
  doc.setTextColor(15, 23, 42)
  doc.text(`Total GHC ${grandTotal.toFixed(2)}`, col4X, totalsY, { align: 'right' })

  // Payment method & Note
  const footerInfoY = totalsY + 42

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9.5)
  doc.setTextColor(15, 23, 42)
  doc.text('Payment method:', margin, footerInfoY)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(51, 65, 85)
  doc.text(data.paymentStatus || 'Cash', margin + 95, footerInfoY)

  doc.setFont('helvetica', 'bold')
  doc.setTextColor(15, 23, 42)
  doc.text('Note:', margin, footerInfoY + 20)

  doc.setFont('helvetica', 'normal')
  doc.setTextColor(51, 65, 85)
  doc.text(data.note || 'Thank you for choosing us!', margin + 38, footerInfoY + 20)

  // Bottom Full-Width Dark Navy Banner
  const bannerHeight = 85
  const bannerY = pageHeight - bannerHeight

  doc.setFillColor(15, 23, 42) // #0F172A
  doc.rect(0, bannerY, pageWidth, bannerHeight, 'F')

  // Center logo inside bottom banner
  if (logoData) {
    try {
      const bannerLogoW = 160
      const bannerLogoH = 48
      doc.addImage(
        logoData,
        'PNG',
        (pageWidth - bannerLogoW) / 2,
        bannerY + (bannerHeight - bannerLogoH) / 2,
        bannerLogoW,
        bannerLogoH
      )
    } catch {
      drawBannerTextFallback(doc, pageWidth, bannerY + bannerHeight / 2)
    }
  } else {
    drawBannerTextFallback(doc, pageWidth, bannerY + bannerHeight / 2)
  }

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(255, 255, 255)
  doc.text('samdamventures.com', pageWidth / 2, bannerY + bannerHeight - 9, { align: 'center' })

  return doc.output('blob')
}

function renderPosReceiptBlob(data: InvoiceData, logoData: string | null): Blob {
  const pageWidth = 80
  const margin = 5
  const contentWidth = pageWidth - margin * 2
  const measureDoc = new jsPDF({ unit: 'mm', format: [pageWidth, 5000] })
  measureDoc.setFontSize(8)
  const customerRows = [
    `Customer: ${data.customerName || 'Walk-in Customer'}`,
    `Delivery Address: ${data.shippingAddress || 'N/A'}`,
    `Contact: ${formatGhanaPhone(data.customerPhone)}`,
    `Email: ${data.customerEmail || 'N/A'}`,
  ]
  const sellerRows = [
    `From: ${data.companyName || 'samdamventures.com'}`,
    'Foster Home Junction, Dodowa Highway',
    'Opposite Jehovah Witness Hall',
    'GPS Address: GM-122-9443',
    'Website: samdamventures.com',
    ...(data.processedBy ? [`Processed by: ${data.processedBy}`] : []),
  ]
  const items = data.items
  const itemBlocks = items.map((item) => ({
    name: measureDoc.splitTextToSize(item.name, contentWidth),
    sku: measureDoc.splitTextToSize(`SKU: ${item.sku}`, contentWidth),
    sale: measureDoc.splitTextToSize(
      `${item.quantity} ${item.unitLabel || 'unit'} x GHC ${item.unitPrice.toFixed(2)}`,
      contentWidth,
    ),
    amount: `GHC ${(item.quantity * item.unitPrice).toFixed(2)}`,
  }))
  const invoiceRows = [
    `Invoice: ${data.soNumber || data.invoiceNumber}`,
    `Invoice count: #${String(data.invoiceCount ?? 1).padStart(3, '0')}`,
    `Date: ${(data.issuedAt ? parseUtcTimestamp(data.issuedAt) : new Date()).toLocaleString('en-GB', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })} Local time`,
  ]
  const noteRows = measureDoc.splitTextToSize(
    data.note || 'Thank you for choosing us!',
    contentWidth,
  )
  const wrapRows = (rows: string[]) => rows.flatMap((row) => measureDoc.splitTextToSize(row, contentWidth))
  const invoiceLines = wrapRows(invoiceRows)
  const customerLines = wrapRows(customerRows)
  const sellerLines = wrapRows(sellerRows)
  const contentLinesHeight = (invoiceLines.length + customerLines.length + sellerLines.length
    + noteRows.length + itemBlocks.reduce((sum, item) => sum + item.name.length + item.sku.length + item.sale.length, 0)) * 4
  const separatorAndGapHeight = 3 * 7 + 2 * 5
  const itemGapHeight = itemBlocks.length * 2
  const footerHeight = 6 + 5 + 7
  const pageHeight = 6 + (logoData ? 14 : 10) + 6 + contentLinesHeight
    + separatorAndGapHeight + itemGapHeight + footerHeight

  const doc = new jsPDF({ unit: 'mm', format: [pageWidth, pageHeight], compress: true })
  let y = 6

  if (logoData) {
    try {
      doc.addImage(logoData, 'PNG', 22, y, 36, 11)
      y += 14
    } catch {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.text('SAMDAM VENTURES', pageWidth / 2, y + 4, { align: 'center' })
      y += 10
    }
  } else {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('SAMDAM VENTURES', pageWidth / 2, y + 4, { align: 'center' })
    y += 10
  }

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text('SALES RECEIPT', pageWidth / 2, y, { align: 'center' })
  y += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  for (const [index, line] of invoiceLines.entries()) {
    doc.setFont('helvetica', index === 0 ? 'bold' : 'normal')
    doc.text(line, margin, y)
    y += 4
  }
  y += 1
  doc.setDrawColor(120, 120, 120)
  doc.setLineDashPattern([1, 1], 0)
  doc.line(margin, y, pageWidth - margin, y)
  doc.setLineDashPattern([], 0)
  y += 5

  doc.setFont('helvetica', 'bold')
  doc.text('BILL TO', margin, y)
  y += 4
  doc.setFont('helvetica', 'normal')
  for (const line of customerLines) {
    doc.text(line, margin, y)
    y += 4
  }

  y += 1
  doc.setFont('helvetica', 'bold')
  doc.text('FROM', margin, y)
  y += 4
  doc.setFont('helvetica', 'normal')
  for (const line of sellerLines) {
    doc.text(line, margin, y)
    y += 4
  }

  y += 2
  doc.setDrawColor(120, 120, 120)
  doc.setLineDashPattern([1, 1], 0)
  doc.line(margin, y, pageWidth - margin, y)
  doc.setLineDashPattern([], 0)
  y += 5

  for (const index of items.keys()) {
    const block = itemBlocks[index]
    doc.setFont('helvetica', 'bold')
    doc.text(block.name, margin, y)
    y += block.name.length * 4

    doc.setFont('helvetica', 'normal')
    for (const line of block.sku) {
      doc.text(line, margin, y)
      y += 4
    }
    for (const line of block.sale) {
      doc.text(line, margin, y)
      y += 4
    }
    doc.setFont('helvetica', 'bold')
    doc.text(block.amount, pageWidth - margin, y, { align: 'right' })
    y += 6
  }

  y += 1
  doc.setDrawColor(120, 120, 120)
  doc.setLineDashPattern([1, 1], 0)
  doc.line(margin, y, pageWidth - margin, y)
  doc.setLineDashPattern([], 0)
  y += 6
  const total = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.text(`TOTAL  GHC ${total.toFixed(2)}`, pageWidth - margin, y, { align: 'right' })
  y += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.text(`Payment: ${data.paymentStatus || 'Cash'}`, margin, y)
  y += 5
  doc.text(noteRows, margin, y)

  return doc.output('blob')
}

function drawFallbackHeaderLogo(doc: jsPDF, x: number, y: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text('SAMDAM VENTURES', x, y + 20)
}

function formatGhanaPhone(phone?: string): string {
  const digits = phone?.replace(/\D/g, '')
  if (!digits) return 'N/A'
  if (digits.startsWith('233')) return `+${digits}`
  if (digits.startsWith('0')) return `+233 ${digits.slice(1)}`
  return `+233 ${digits}`
}

function drawBannerTextFallback(doc: jsPDF, pageWidth: number, centerY: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(255, 255, 255)
  doc.text('SAMDAM VENTURES', pageWidth / 2, centerY + 4, { align: 'center' })
}

export async function generateInvoice(data: InvoiceData) {
  const url = await generateInvoiceBlob(data)
  const link = document.createElement('a')
  link.href = url
  link.download = `invoice-${data.invoiceNumber}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}