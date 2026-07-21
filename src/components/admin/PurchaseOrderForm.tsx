import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type PurchaseOrderFormProps = {
  onClose: () => void
  onPurchaseRecorded?: (itemName: string, quantity: number, unitPrice: number, total: number) => void
}

export default function PurchaseOrderForm({
  onClose,
  onPurchaseRecorded,
}: PurchaseOrderFormProps) {
  const [itemName, setItemName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unitPrice, setUnitPrice] = useState('0')

  const parsedQuantity = Number(quantity)
  const parsedUnitPrice = Number(unitPrice)
  const total = Number.isFinite(parsedQuantity) && Number.isFinite(parsedUnitPrice)
    ? parsedQuantity * parsedUnitPrice
    : 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!itemName.trim()) {
      toast.error('Please enter the item name')
      return
    }

    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      toast.error('Quantity must be greater than zero')
      return
    }

    if (!Number.isFinite(parsedUnitPrice) || parsedUnitPrice < 0) {
      toast.error('Unit price must be zero or greater')
      return
    }

    onPurchaseRecorded?.(itemName.trim(), parsedQuantity, parsedUnitPrice, total)
    toast.success(`${itemName.trim()} recorded successfully`)
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="item-name" className="mb-1 block">
          Item name
        </Label>
        <Input
          id="item-name"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          placeholder="e.g. Laptop Charger"
          required
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label htmlFor="quantity" className="mb-1 block">
            Quantity
          </Label>
          <Input
            id="quantity"
            type="number"
            min="1"
            step="1"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="unit-price" className="mb-1 block">
            Unit price
          </Label>
          <Input
            id="unit-price"
            type="number"
            min="0"
            step="0.01"
            value={unitPrice}
            onChange={(e) => setUnitPrice(e.target.value)}
            required
          />
        </div>
      </div>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-600">Estimated total</p>
        <p className="mt-1 text-lg font-semibold text-slate-900">
          ${total.toFixed(2)}
        </p>
      </div>

      <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700">
        Record Purchase
      </Button>
    </form>
  )
}