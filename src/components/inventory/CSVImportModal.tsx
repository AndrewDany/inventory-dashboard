import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, AlertCircle } from 'lucide-react'
import { useBulkImportItems } from '../../hooks/useBulkImport'
import { Button } from '@/components/ui/button'
import { parseCSVText } from '../../lib/importInventory'
import type { CSVImportRow } from '../../lib/importInventory'

export default function CSVImportModal({ onClose }: { onClose: () => void }) {
  const [rows, setRows] = useState<CSVImportRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkImport = useBulkImportItems()

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    parseCSV(f)
  }

  function parseCSV(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      const result = parseCSVText(text)
      setRows(result.rows)
      setErrors(result.errors.map((er) => `Row ${er.row}: ${er.message}`))
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (rows.length === 0) return
    try {
      await bulkImport.mutateAsync(rows)
      onClose()
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-400 transition-colors"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={handleFileSelect}
        />
        <Upload size={32} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm font-medium text-gray-700">
          {file ? file.name : 'Click to select CSV file'}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Required columns: name, sku — Optional: quantity, unit_price, category, reorder_level, supplier
        </p>
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-center gap-2 text-red-700 text-sm font-medium mb-1">
            <AlertCircle size={14} />
            Parse Warnings
          </div>
          <ul className="text-xs text-red-600 space-y-0.5">
            {errors.slice(0, 10).map((e, i) => (
              <li key={i}>{e}</li>
            ))}
            {errors.length > 10 && <li>...and {errors.length - 10} more</li>}
          </ul>
        </div>
      )}

      {rows.length > 0 && (
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
          <table className="w-full text-xs">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="text-left px-3 py-2 text-gray-500">Name</th>
                <th className="text-left px-3 py-2 text-gray-500">SKU</th>
                <th className="text-right px-3 py-2 text-gray-500">Qty</th>
                <th className="text-right px-3 py-2 text-gray-500">Price</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 50).map((row, i) => (
                <tr key={i} className="border-t border-gray-100">
                  <td className="px-3 py-2">{row.name}</td>
                  <td className="px-3 py-2 text-gray-500">{row.sku}</td>
                  <td className="px-3 py-2 text-right">{row.quantity}</td>
                  <td className="px-3 py-2 text-right">GHS {row.unit_price?.toFixed(2)}</td>
                </tr>
              ))}
              {rows.length > 50 && (
                <tr>
                  <td colSpan={4} className="px-3 py-2 text-center text-gray-400">
                    ...and {rows.length - 50} more rows
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-between items-center pt-2">
        <p className="text-xs text-gray-500">
          {rows.length > 0 ? `${rows.length} rows ready` : 'No data loaded'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleImport}
            disabled={rows.length === 0 || bulkImport.isPending}
          >
            {bulkImport.isPending ? (
              'Importing...'
            ) : (
              <>
                <FileSpreadsheet size={14} className="mr-1" />
                Import {rows.length} Items
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
