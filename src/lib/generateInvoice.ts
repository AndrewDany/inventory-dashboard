import jsPDF from 'jspdf'

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

export function generateInvoiceBlob(data: InvoiceData): string {
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

  doc.setFillColor(246, 246, 246)
  doc.rect(0, 0, pageWidth, pageHeight, 'F')

  doc.setTextColor(17, 17, 17)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(9)
  doc.text((data.companyName || 'YOUR LOGO').toUpperCase(), margin, 48)

  doc.setFontSize(8)
  doc.setTextColor(72, 72, 72)
  doc.text('NO.', pageWidth - margin - 54, 48, { align: 'right' })
  doc.text(data.invoiceNumber || '000001', pageWidth - margin, 48, { align: 'right' })

  doc.setTextColor(17, 17, 17)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(58)
  doc.text(`INVOICE #${dailyInvoiceNumber}`, margin, 122)

  doc.setFontSize(11)
  doc.text(`Date: ${dateText}`, margin, 156)
  doc.setFont('helvetica', 'normal')
  doc.text(`Time: ${timeText}`, margin, 173)

  const leftX = margin
  const rightX = pageWidth / 2 + 28
  const contactY = 188

  doc.setFont('helvetica', 'bold')
  doc.text('Bill to', leftX, contactY)
  const billRows = [
    ['Customer name:', data.customerName || '-'],
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
    data.companyName || 'Olivia Wilson',
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
    { name: 'Logo', quantity: 1, unitPrice: 500 },
    { name: 'Banner (2x6m)', quantity: 2, unitPrice: 45 },
    { name: 'Poster (1x2m)', quantity: 3, unitPrice: 55 },
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

export function generateInvoice(data: InvoiceData) {
  const url = generateInvoiceBlob(data)
  const link = document.createElement('a')
  link.href = url
  link.download = `invoice-${data.invoiceNumber}.pdf`
  link.click()
  URL.revokeObjectURL(url)
}