import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
  const doc = new jsPDF()
  const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const grandTotal = subtotal

  // Header
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(data.companyName, 14, 20)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(90)
  doc.text('INVOICE', 196, 20, { align: 'right' })
  doc.text(`Invoice #: ${data.invoiceNumber}`, 196, 26, { align: 'right' })
  const issuedAt = new Date()
  if (data.invoiceCount != null) {
    doc.setFillColor(30, 41, 59)
    doc.roundedRect(14, 28, 42, 28, 3, 3, 'F')
    doc.setTextColor(255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(24)
    doc.text(String(data.invoiceCount), 35, 45, { align: 'center' })
    doc.setFontSize(7)
    doc.text('INVOICE COUNT', 35, 51, { align: 'center' })
    doc.setTextColor(90)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(10)
    doc.text(`Order #: ${data.soNumber}`, 196, 36, { align: 'right' })
    doc.text(`Date & Time: ${issuedAt.toLocaleString()}`, 196, 42, { align: 'right' })
  } else {
    doc.text(`Order #: ${data.soNumber}`, 196, 32, { align: 'right' })
    doc.text(`Date & Time: ${issuedAt.toLocaleString()}`, 196, 38, { align: 'right' })
  }

  // Customer Details Section
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Customer Bill', 14, 66)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  let yPos = 74
  if (data.customerName) {
    doc.text(`Customer Name: ${data.customerName}`, 14, yPos)
    yPos += 6
  }
  if (data.customerEmail) {
    doc.text(`Invoicing Email: ${data.customerEmail}`, 14, yPos)
    yPos += 6
  }
  if (data.customerPhone) {
    doc.text(`Contact Phone: ${data.customerPhone}`, 14, yPos)
    yPos += 6
  }
  if (data.shippingAddress) {
    doc.text(`Delivery Address: ${data.shippingAddress}`, 14, yPos)
    yPos += 6
  }

  doc.setFont('helvetica', 'bold')
  doc.text(`Payment Status: ${data.paymentStatus}`, 124, 66)
  doc.setFont('helvetica', 'normal')

  if (data.processedBy) {
    doc.text(`Processed by: ${data.processedBy}`, 124, 72)
  }

  const tableStartY = yPos + 8

  // Items Table
  autoTable(doc, {
    startY: tableStartY,
    head: [['Catalog Product Line', 'Retail Unit Price', 'Checkout Qty', 'Subtotal']],
    body: data.items.map((item) => [
      item.name,
      `GHS ${item.unitPrice.toFixed(2)}${item.unitLabel ? ` /${item.unitLabel}` : ''}`,
      `${item.quantity}${item.unitLabel ? ` ${item.unitLabel}` : ''}`,
      `GHS ${(item.quantity * item.unitPrice).toFixed(2)}`,
    ]),
    headStyles: { fillColor: [79, 70, 229], halign: 'center' },
    styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
    columnStyles: {
      0: { cellWidth: 72, halign: 'left' },
      1: { cellWidth: 38, halign: 'center' },
      2: { cellWidth: 28, halign: 'center' },
      3: { cellWidth: 44, halign: 'right' },
    },
    didParseCell: (hookData) => {
      if (hookData.section === 'head' && hookData.column.index === 0) hookData.cell.styles.halign = 'left'
      if (hookData.section === 'head' && hookData.column.index === 3) hookData.cell.styles.halign = 'right'
    },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 10

  // Basket Summary
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Basket Subtotal:', 130, finalY)
  doc.text(`GHS ${subtotal.toFixed(2)}`, 190, finalY, { align: 'right' })

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(12)
  doc.text('Grand Total Paid:', 130, finalY + 8)
  doc.text(`GHS ${grandTotal.toFixed(2)}`, 190, finalY + 8, { align: 'right' })

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(150)
  doc.text('Thank you for your business.', 14, 285)

  // Return blob URL instead of auto-downloading
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