import { useState } from 'react'
import { Download, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { useInventory } from '../../hooks/useInventory'
import { exportLowStockToCSV, exportLowStockToPDF } from '../../lib/exportInventory'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function LowStockTracker() {
  const { data: items, isLoading, error } = useInventory()
  const [pdfLoading, setPdfLoading] = useState(false)

  if (isLoading) return <p className="text-gray-500 text-sm">Loading...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>

  const lowStockItems = (items ?? [])
    .filter((item) => item.quantity <= item.reorder_level)
    .sort((a, b) => a.quantity - b.quantity)

  if (lowStockItems.length === 0)
    return <p className="text-gray-500 text-sm">All items are above their reorder level.</p>

  async function downloadPDF() {
    setPdfLoading(true)
    try {
      await exportLowStockToPDF(lowStockItems)
    } catch (downloadError) {
      toast.error(downloadError instanceof Error ? downloadError.message : 'Unable to export low stock report')
    } finally {
      setPdfLoading(false)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">{lowStockItems.length} items need attention</p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportLowStockToCSV(lowStockItems)}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            <Download size={16} />
            Download CSV
          </button>
          <button
            type="button"
            onClick={downloadPDF}
            disabled={pdfLoading}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FileText size={16} />
            {pdfLoading ? 'Preparing PDF...' : 'Download PDF'}
          </button>
        </div>
      </div>
      <div className="max-h-[28rem] overflow-y-auto rounded-lg border border-slate-200">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-white">
              <TableRow>
                <TableHead className="whitespace-nowrap">Item</TableHead>
                <TableHead className="whitespace-nowrap">SKU</TableHead>
                <TableHead className="whitespace-nowrap">Type</TableHead>
                <TableHead className="whitespace-nowrap">Brand</TableHead>
                <TableHead className="whitespace-nowrap">Color</TableHead>
                <TableHead className="whitespace-nowrap">Size</TableHead>
                <TableHead className="whitespace-nowrap">Current Qty</TableHead>
                <TableHead className="whitespace-nowrap">Reorder Level</TableHead>
                <TableHead className="whitespace-nowrap">Supplier</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {lowStockItems.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium whitespace-nowrap">{item.name}</TableCell>
                  <TableCell className="text-gray-500 font-mono text-xs whitespace-nowrap">{item.sku}</TableCell>
                  <TableCell className="text-gray-600 whitespace-nowrap">{item.type || '—'}</TableCell>
                  <TableCell className="text-gray-600 whitespace-nowrap">{item.brand || '—'}</TableCell>
                  <TableCell className="text-gray-600 whitespace-nowrap">{item.color || '—'}</TableCell>
                  <TableCell className="text-gray-600 whitespace-nowrap">{item.size || '—'}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{item.quantity}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">{item.reorder_level}</TableCell>
                  <TableCell className="text-gray-600 whitespace-nowrap">{item.supplier || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}