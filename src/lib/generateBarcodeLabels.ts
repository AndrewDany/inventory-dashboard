import jsPDF from 'jspdf'

export interface LabelItem {
  sku: string
  name: string
  unitPrice?: number | null
}

export function generateBarcodeLabelsPDF(
  items: LabelItem[],
  copiesPerItem = 1,
  companyName = 'Inventory Dashboard'
): string {
  const doc = new jsPDF('p', 'mm', 'a4')
  const pageWidth = 210
  const pageHeight = 297
  const margin = 10
  const cols = 2
  const rows = 4
  const labelWidth = (pageWidth - margin * 3) / cols
  const labelHeight = (pageHeight - margin * 2) / rows

  let currentPage = 0
  let col = 0
  let row = 0

  function drawLabel(item: LabelItem) {
    const x = margin + col * (labelWidth + margin)
    const y = margin + row * (labelHeight + margin)

    // Border
    doc.setDrawColor(200)
    doc.setLineWidth(0.3)
    doc.rect(x, y, labelWidth, labelHeight)

// Company name
    doc.setFontSize(7)
    doc.setTextColor(120)
    doc.text(companyName, (x + 3) as unknown as number, y + 5)

    // Item name
    doc.setFontSize(9)
    doc.setTextColor(0)
    doc.setFont('helvetica', 'bold')
    const name = item.name.length > 25 ? item.name.slice(0, 22) + '...' : item.name
    doc.text(name, x + 3, y + 12)
    doc.setFont('helvetica', 'normal')

    // SKU
    doc.setFontSize(8)
    doc.setTextColor(80)
    doc.text(`SKU: ${item.sku}`, x + 3, y + 19)

    // Price
    if (item.unitPrice != null) {
      doc.setFontSize(8)
      doc.setTextColor(0)
      doc.text(`GHS ${item.unitPrice.toFixed(2)}`, x + 3, y + 26)
    }

    // Barcode pattern
    const barcodeY = y + 30
    const barcodeX = x + 3
    const barcodeW = labelWidth - 6
    const barcodeH = 20

    doc.setFillColor(0, 0, 0)
    doc.setDrawColor(0, 0, 0)
    const pattern = generateBarcodePattern(item.sku)
    const barWidth = barcodeW / pattern.length
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i] === '1') {
        doc.rect(barcodeX + i * barWidth, barcodeY, Math.max(barWidth, 0.5), barcodeH, 'F')
      }
    }

    // SKU below barcode
    doc.setFontSize(6)
    doc.setTextColor(0)
    const centerX = barcodeX + barcodeW / 2
    doc.text(item.sku, centerX, barcodeY + barcodeH + 4, { align: 'center' })
  }

  // Generate all label items
  const allLabels: LabelItem[] = []
  for (const item of items) {
    for (let c = 0; c < copiesPerItem; c++) {
      allLabels.push(item)
    }
  }

  for (const labelItem of allLabels) {
    if (col >= cols) {
      col = 0
      row++
      if (row >= rows) {
        row = 0
        currentPage++
        if (currentPage > 0) {
          doc.addPage()
        }
      }
    }
    drawLabel(labelItem)
    col++
  }

  const blob = doc.output('blob')
  return URL.createObjectURL(blob)
}

function generateBarcodePattern(sku: string): string {
  let hash = 0
  for (let i = 0; i < sku.length; i++) {
    hash = ((hash << 5) - hash) + sku.charCodeAt(i)
    hash = hash & hash
  }
  const seed = Math.abs(hash)
  const patternLength = 80
  let pattern = ''
  for (let i = 0; i < patternLength; i++) {
    pattern += ((seed * (i + 1) * 7) % 3 === 0) ? '1' : '0'
  }
  return '101' + pattern + '101'
}

export function printBarcodeLabels(
  items: LabelItem[],
  copiesPerItem = 1,
  companyName = 'Inventory Dashboard'
) {
  const url = generateBarcodeLabelsPDF(items, copiesPerItem, companyName)
  const win = window.open(url)
  if (win) {
    win.onload = () => {
      win.print()
    }
  }
}
