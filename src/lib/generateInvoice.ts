import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export interface InvoiceLineItem {
  sku: string
  name: string
  quantity: number
  unitPrice: number
}

export interface InvoiceData {
  invoiceNumber: string
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
  doc.setTextColor(120)
  doc.text('INVOICE', 190, 20, { align: 'right' })
  doc.text(`Invoice #: ${data.invoiceNumber}`, 190, 26, { align: 'right' })
  doc.text(`Order #: ${data.soNumber}`, 190, 31, { align: 'right' })
  doc.text(`Date: ${new Date().toLocaleDateString()}`, 190, 36, { align: 'right' })

  // Customer Details Section
  doc.setTextColor(0)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text('Customer Bill', 14, 48)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)

  let yPos = 56
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
    doc.text(`Shipping Destination Address: ${data.shippingAddress}`, 14, yPos)
    yPos += 6
  }

  doc.setFont('helvetica', 'bold')
  doc.text(`Payment Status: ${data.paymentStatus}`, 120, 48)
  doc.setFont('helvetica', 'normal')

  if (data.processedBy) {
    doc.text(`Processed by: ${data.processedBy}`, 120, 54)
  }

  const tableStartY = yPos + 8

  // Items Table
  autoTable(doc, {
    startY: tableStartY,
    head: [['Catalog Product Line', 'Retail Unit Price', 'Checkout Qty', 'Subtotal']],
    body: data.items.map((item) => [
      item.name,
      `GHS ${item.unitPrice.toFixed(2)}`,
      item.quantity.toString(),
      `GHS ${(item.quantity * item.unitPrice).toFixed(2)}`,
    ]),
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 9 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
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

