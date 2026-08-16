import { useState, useRef, useCallback } from 'react'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft, Table, FileText, Download } from 'lucide-react'
import { useBulkImportItems } from '../../hooks/useBulkImport'
import { useLocations } from '../../hooks/useLocations'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { parseCSVText, type CSVImportRow } from '../../lib/importInventory'

type Step = 'upload' | 'preview' | 'done' | 'importing'

const HEADER_MAP_OPTIONS = [
  { value: 'name', label: 'Product Name *' },
  { value: 'sku', label: 'SKU *' },
  { value: 'category', label: 'Category' },
  { value: 'quantity', label: 'Quantity' },
  { value: 'unit_price', label: 'Unit Price' },
  { value: 'reorder_level', label: 'Reorder Level' },
  { value: 'supplier', label: 'Supplier' },
{ value: 'location_id', label: 'Location' },
  { value: '__skip__', label: '— Skip Column —' },
]

const SAMPLE_CSV = `name,sku,category,quantity,unit_price,reorder_level,supplier
Laptop Charger,CHRG-LP-001,Electronics,50,120.00,10,TechShop
USB-C Cable,CBL-USBC-002,Accessories,200,15.00,50,CableWorld
Mouse Pad,PAD-MS-003,Accessories,150,8.50,30,OfficeSupply`

export default function BulkProductModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [rawText, setRawText] = useState('')
  const [parsedRows, setParsedRows] = useState<CSVImportRow[]>([])
  const [errors, setErrors] = useState<string[]>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [headerMap, setHeaderMap] = useState<Record<number, string>>({})
  const [defaultLocationId, setDefaultLocationId] = useState<string>('')
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkImport = useBulkImportItems()
  const { data: locations } = useLocations()

  const reset = useCallback(() => {
    setStep('upload')
    setFile(null)
    setRawText('')
    setParsedRows([])
    setErrors([])
    setCsvHeaders([])
    setHeaderMap({})
  }, [])

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) handleFile(f)
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  function handleFile(file: File) {
    if (!file.name.endsWith('.csv') && !file.name.endsWith('.txt')) {
      setErrors([`Unsupported file type: ${file.name}. Please upload a .csv file.`])
      return
    }
    setFile(file)
    setErrors([])
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      setRawText(text)
      parseAndPreview(text)
    }
    reader.readAsText(file)
  }

  function handlePasteParse() {
    if (!rawText.trim()) {
      setErrors(['Please paste or upload CSV data first'])
      return
    }
    parseAndPreview(rawText)
  }

  function parseAndPreview(text: string) {
    // Extract headers for column mapping
    const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) {
      setErrors(['CSV must have a header row and at least one data row'])
      setParsedRows([])
      setCsvHeaders([])
      return
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/['"]/g, ''))
    setCsvHeaders(headers)

    // Auto-map headers
    const autoMap: Record<number, string> = {}
    const knownFields = new Set(HEADER_MAP_OPTIONS.map((o) => o.value))
    const lowerHeaders = headers.map((h) => h.toLowerCase().replace(/[^a-z_]/g, ''))
    const usedFields = new Set<string>()

    lowerHeaders.forEach((h, i) => {
      if (knownFields.has(h) && !usedFields.has(h)) {
        autoMap[i] = h
        usedFields.add(h)
      }
    })
    setHeaderMap(autoMap)

    // Parse with current mapping
    const result = parseCSVText(text)
    setParsedRows(result.rows)
    setErrors(result.errors.map((er) => `Row ${er.row}: ${er.message}`))
    setStep('preview')
  }

  function updateHeaderMap(colIndex: number, field: string) {
    setHeaderMap((prev) => {
      const next = { ...prev }
      if (field === '__skip__') {
        delete next[colIndex]
      } else {
        // Remove this field from any other column
        for (const key of Object.keys(next)) {
          if (next[Number(key)] === field) {
            delete next[Number(key)]
          }
        }
        next[colIndex] = field
      }
      return next
    })
  }

  function getMappedRows(): CSVImportRow[] {
    if (csvHeaders.length === 0) return parsedRows

    // Re-parse with custom mapping
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean)
    if (lines.length < 2) return []

    const mappedRows: CSVImportRow[] = []
    const mapErrors: string[] = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/['"]/g, ''))
      const rowData: Record<string, string> = {}

      Object.entries(headerMap).forEach(([colIdx, field]) => {
        if (field && field !== '__skip__') {
          rowData[field] = values[Number(colIdx)] ?? ''
        }
      })

      // Ensure required fields
      if (!rowData.name) {
        mapErrors.push(`Row ${i + 1}: Name is required`)
        continue
      }
      if (!rowData.sku) {
        mapErrors.push(`Row ${i + 1}: SKU is required`)
        continue
      }

      mappedRows.push({
        name: rowData.name,
        sku: rowData.sku,
        category: rowData.category || '',
        quantity: parseInt(rowData.quantity) || 0,
        unit_price: parseFloat(rowData.unit_price) || undefined,
        reorder_level: parseInt(rowData.reorder_level) || 0,
        supplier: rowData.supplier || '',
        location_id: rowData.location_id || defaultLocationId || '',
      })
    }

    if (mapErrors.length > 0) {
      setErrors(mapErrors)
    }

    return mappedRows
  }

  async function handleImport() {
    const rawMapped = getMappedRows()
    const rowsToImport: CSVImportRow[] = rawMapped.map((row) => ({
      ...row,
      location_id: row.location_id || defaultLocationId || '',
    }))

    if (rowsToImport.length === 0) {
      setErrors(['No valid rows to import'])
      return
    }

    setStep('importing')
    try {
      await bulkImport.mutateAsync(rowsToImport)
      setStep('done')
    } catch {
      setStep('preview')
    }
  }

  function downloadSampleCSV() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-products.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // --- RENDER ---

  if (step === 'done') {
    return (
      <div className="space-y-6 py-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 size={32} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Import Complete!</h3>
          <p className="mt-1 text-sm text-slate-500">
            {bulkImport.data?.inserted ?? parsedRows.length} products have been added to your inventory.
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Button variant="outline" onClick={reset}>
            Import More
          </Button>
          <Button onClick={onClose} className="bg-indigo-600 hover:bg-indigo-700">
            Done
          </Button>
        </div>
      </div>
    )
  }

  if (step === 'importing') {
    return (
      <div className="space-y-6 py-6 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
          <FileSpreadsheet size={32} className="text-indigo-600 animate-pulse" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Importing Products...</h3>
          <p className="mt-1 text-sm text-slate-500">
            Processing {parsedRows.length} products in batches. This may take a moment.
          </p>
        </div>
        <div className="mx-auto w-48 h-2 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full animate-pulse" style={{ width: '60%' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 ${step === 'upload' ? 'text-indigo-600' : 'text-emerald-600'}`}>
          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${step === 'upload' ? 'bg-indigo-600' : 'bg-emerald-500'}`}>
            {step === 'preview' ? <CheckCircle2 size={14} /> : '1'}
          </div>
          <span className="text-xs font-medium">Upload</span>
        </div>
        <div className="flex-1 h-px bg-slate-200" />
        <div className={`flex items-center gap-1.5 ${step === 'preview' ? 'text-indigo-600' : 'text-slate-400'}`}>
          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white ${step === 'preview' ? 'bg-indigo-600' : 'bg-slate-300'}`}>
            2
          </div>
          <span className="text-xs font-medium">Preview & Map</span>
        </div>
        <div className="flex-1 h-px bg-slate-200" />
        <div className="flex items-center gap-1.5 text-slate-400">
          <div className="flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold text-white bg-slate-300">
            3
          </div>
          <span className="text-xs font-medium">Import</span>
        </div>
      </div>

      {/* ===== STEP 1: UPLOAD ===== */}
      {step === 'upload' && (
        <>
          <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4">
            <p className="text-sm font-medium text-indigo-800">Bulk Add Products</p>
            <p className="mt-1 text-xs text-indigo-600">
              Upload a CSV file or paste data to add up to 2000 products at once.
            </p>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-indigo-400 bg-indigo-50'
                : 'border-slate-300 hover:border-indigo-300 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={handleFileSelect}
            />
            <Upload size={36} className={`mx-auto mb-3 ${dragOver ? 'text-indigo-500' : 'text-slate-400'}`} />
            <p className="text-sm font-medium text-slate-700">
              {file ? file.name : 'Drop your CSV file here, or click to browse'}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supports .csv files with headers: Name, SKU, Category, Quantity, Price, etc.
            </p>
            {file && (
              <p className="text-xs text-emerald-600 mt-2 font-medium">
                {(rawText.split('\n').length - 1)} lines detected
              </p>
            )}
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-2 text-xs text-slate-400">or paste data manually</span>
            </div>
          </div>

          {/* Paste area */}
          <div>
            <Label className="mb-1 block text-xs text-slate-500">
              Paste Product Data
            </Label>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Paste comma-separated data here..."
              rows={5}
              className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm font-mono text-slate-700 placeholder:text-slate-300 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 resize-y"
            />
          </div>

          {/* Sample download */}
          <div className="flex items-center justify-between">
            <button
              onClick={downloadSampleCSV}
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700"
            >
              <Download size={12} />
              Download sample CSV
            </button>

            <Button
              type="button"
              onClick={handlePasteParse}
              disabled={!rawText.trim()}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <ArrowRight size={16} className="mr-1.5" />
              Preview Products
            </Button>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </>
      )}

      {/* ===== STEP 2: PREVIEW & MAP ===== */}
      {step === 'preview' && (
        <>
          {/* File info */}
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <FileText size={20} className="text-slate-400" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-700 truncate">
                {file ? file.name : 'Pasted data'}
              </p>
              <p className="text-xs text-slate-500">
                {parsedRows.length} product{parsedRows.length !== 1 ? 's' : ''} detected
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              Change File
            </Button>
          </div>

          {/* Default location */}
          {locations && locations.length > 0 && (
            <div>
              <Label className="mb-1 block text-xs text-slate-500">Default Location (applied to all products)</Label>
              <Select value={defaultLocationId} onValueChange={(v) => setDefaultLocationId(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="No location (optional)" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Column Mapping */}
          {csvHeaders.length > 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                <Table size={14} />
                Column Mapping
              </p>
              <div className="space-y-1.5">
                {csvHeaders.map((header, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span className="w-28 shrink-0 font-mono text-slate-500 truncate">{header}</span>
                    <span className="text-slate-300">→</span>
                    <Select
                      value={headerMap[idx] || '__skip__'}
                      onValueChange={(v) => updateHeaderMap(idx, v ?? '__skip__')}
                    >
                      <SelectTrigger className="flex-1 h-7 text-xs">
                        <SelectValue placeholder="Select field..." />
                      </SelectTrigger>
                      <SelectContent>
                        {HEADER_MAP_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="flex items-center gap-2 text-amber-700 text-sm font-medium mb-1">
                <AlertCircle size={14} />
                {parsedRows.length > 0
                  ? `${parsedRows.length} products parsed with ${errors.length} warnings`
                  : 'Parse Errors'}
              </div>
              <ul className="text-xs text-amber-600 space-y-0.5 max-h-24 overflow-y-auto">
                {errors.slice(0, 10).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {errors.length > 10 && <li>...and {errors.length - 10} more</li>}
              </ul>
            </div>
          )}

          {/* Success */}
          {parsedRows.length > 0 && errors.length === 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-2 text-emerald-700 text-sm">
              <CheckCircle2 size={16} />
              <span className="font-medium">{parsedRows.length} products</span> parsed and ready
            </div>
          )}

          {/* Preview table */}
          {parsedRows.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="text-left px-3 py-2 text-slate-500 font-medium">#</th>
                    <th className="text-left px-3 py-2 text-slate-500 font-medium">Name</th>
                    <th className="text-left px-3 py-2 text-slate-500 font-medium">SKU</th>
                    <th className="text-right px-3 py-2 text-slate-500 font-medium">Qty</th>
                    <th className="text-right px-3 py-2 text-slate-500 font-medium">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 50).map((row, i) => (
                    <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-3 py-2 text-slate-400">{i + 1}</td>
                      <td className="px-3 py-2 font-medium text-slate-800">{row.name}</td>
                      <td className="px-3 py-2 text-slate-500">{row.sku}</td>
                      <td className="px-3 py-2 text-right">{row.quantity}</td>
                      <td className="px-3 py-2 text-right">GHS {row.unit_price?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))}
                  {parsedRows.length > 50 && (
                    <tr>
                      <td colSpan={5} className="px-3 py-2 text-center text-slate-400">
                        ...and {parsedRows.length - 50} more rows
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between items-center pt-2 border-t border-slate-100">
            <p className="text-xs text-slate-500">
              {parsedRows.length > 0
                ? `${parsedRows.length} product${parsedRows.length !== 1 ? 's' : ''} ready to import`
                : 'No valid products to import'}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={reset}>
                <ArrowLeft size={14} className="mr-1" />
                Back
              </Button>
              <Button
                onClick={handleImport}
                disabled={parsedRows.length === 0 || bulkImport.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {bulkImport.isPending ? (
                  'Importing...'
                ) : (
                  <>
                    <FileSpreadsheet size={14} className="mr-1" />
                    Import {parsedRows.length > 0 ? `${parsedRows.length} Product${parsedRows.length !== 1 ? 's' : ''}` : ''}
                  </>
                )}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
