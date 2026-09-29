import jsPDF from 'jspdf'
import samdamLogoUrl from '../assets/landing/samdamlogo.png'

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
        canvas.width = img.naturalWidth || img.width
        canvas.height = img.naturalHeight || img.height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0)
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

export async function generateInvoiceBlob(data: InvoiceData): Promise<string> {
  // Ensure logo is loaded if possible
  const logoData = data.logoDataUrl || cachedLogoDataUrl || (await getLogoDataUrl())

  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth() // 595.28
  const pageHeight = doc.internal.pageSize.getHeight() // 841.89
  const margin = 42
  const usableWidth = pageWidth - margin * 2 // 511.28

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
    hour12: true,
  })

  // Format invoice daily count as e.g. #003
  const dailyInvoiceNumber = String(data.invoiceCount ?? 1).padStart(3, '0')

  // Background - Clean White
  doc.setFillColor(255, 255, 255)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

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
    ['Customer name:', data.customerName || 'Janet Amoako'],
    ['Delivery Address:', data.shippingAddress || '+2335757118937'],
    ['Email:', data.customerEmail || 'kukuaayerko@gmail.com'],
    ['Contact:', data.customerPhone || '0543604166'],
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

  const blob = doc.output('blob')
  return URL.createObjectURL(blob)
}

function drawFallbackHeaderLogo(doc: jsPDF, x: number, y: number) {
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(16)
  doc.setTextColor(15, 23, 42)
  doc.text('SAMDAM VENTURES', x, y + 20)
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
