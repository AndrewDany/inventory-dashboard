import { useState, useMemo } from 'react'
import { Printer } from 'lucide-react'
import { useInventory } from '../../hooks/useInventory'
import { generateBarcodeLabelsPDF } from '../../lib/generateBarcodeLabels'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

export default function BarcodeLabelPrinter({ onClose }: { onClose: () => void }) {
  const { data: items } = useInventory()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [copies, setCopies] = useState(1)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const allItems = useMemo(() => items ?? [], [items])

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selectAll() {
    if (selected.size === allItems.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(allItems.map((i) => i.id)))
    }
  }

  function handlePreview() {
    const labelItems = allItems
      .filter((i) => selected.has(i.id))
      .map((i) => ({ sku: i.sku, name: i.name, unitPrice: i.unit_price }))
    const url = generateBarcodeLabelsPDF(labelItems, copies)
    setPreviewUrl(url)
  }

  function handlePrint() {
    if (previewUrl) {
      const win = window.open(previewUrl)
      if (win) {
        win.onload = () => win.print()
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Copies per label</Label>
        <Input
          type="number"
          min={1}
          max={10}
          value={copies}
          onChange={(e) => setCopies(Math.max(1, Math.min(10, Number(e.target.value))))}
          className="w-20"
        />
      </div>

      <div className="border border-gray-200 rounded-lg max-h-64 overflow-y-auto">
        <div className="sticky top-0 bg-gray-50 border-b border-gray-200 px-3 py-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Checkbox checked={selected.size === allItems.length && allItems.length > 0} onCheckedChange={selectAll} />
            Select All ({allItems.length} items)
          </label>
        </div>
        {allItems.map((item) => (
          <label
            key={item.id}
            className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-0"
          >
            <Checkbox checked={selected.has(item.id)} onCheckedChange={() => toggle(item.id)} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{item.name}</p>
              <p className="text-xs text-gray-500">{item.sku}</p>
            </div>
            <span className="text-xs text-gray-600">{item.quantity} in stock</span>
          </label>
        ))}
      </div>

      {previewUrl && (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <iframe src={previewUrl} className="w-full h-64" title="Label Preview" />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="outline"
          onClick={handlePreview}
          disabled={selected.size === 0}
        >
          Preview
        </Button>
        <Button
          onClick={handlePrint}
          disabled={!previewUrl}
        >
          <Printer size={14} className="mr-1" />
          Print Labels
        </Button>
      </div>
    </div>
  )
}
