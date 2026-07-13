import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { InventoryItem } from '../types/inventory'

export function exportToCSV(items: InventoryItem[]) {
  const headers = ['Name', 'SKU', 'Category', 'Quantity', 'Reorder Level', 'Unit Price', 'Supplier']
  const rows = items.map((item) => [
    item.name,
    item.sku,
    item.category ?? '',
    item.quantity,
    item.reorder_level,
    item.unit_price ?? '',
    item.supplier ?? '',
  ])

  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `inventory-export-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function exportToPDF(items: InventoryItem[], companyName = 'Inventory Dashboard') {
  const doc = new jsPDF()

  doc.setFontSize(16)
  doc.text(companyName, 14, 18)
  doc.setFontSize(10)
  doc.setTextColor(120)
  doc.text(`Inventory Report — Generated ${new Date().toLocaleDateString()}`, 14, 25)

  const totalValue = items.reduce((sum, item) => sum + item.quantity * (item.unit_price ?? 0), 0)
  const lowStockCount = items.filter((item) => item.quantity <= item.reorder_level).length

  doc.setTextColor(0)
  doc.setFontSize(10)
  doc.text(`Total Items: ${items.length}`, 14, 34)
  doc.text(`Total Value: GHS ${totalValue.toFixed(2)}`, 70, 34)
  doc.text(`Low Stock Items: ${lowStockCount}`, 150, 34)

  autoTable(doc, {
    startY: 40,
    head: [['Name', 'SKU', 'Category', 'Qty', 'Reorder', 'Unit Price', 'Supplier']],
    body: items.map((item) => [
      item.name,
      item.sku,
      item.category ?? '—',
      item.quantity,
      item.reorder_level,
      item.unit_price != null ? `GHS ${item.unit_price.toFixed(2)}` : '—',
      item.supplier ?? '—',
    ]),
    headStyles: { fillColor: [79, 70, 229] },
    styles: { fontSize: 8 },
  })

  doc.save(`inventory-report-${new Date().toISOString().slice(0, 10)}.pdf`)
}