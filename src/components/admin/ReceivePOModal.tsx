import { useState } from 'react'
import { useReceivePurchaseOrder } from '../../hooks/usePurchaseOrders'
import { useLocations } from '../../hooks/useLocations'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import type { PurchaseOrderWithItems } from '../../hooks/usePurchaseOrders'

export default function ReceivePOModal({
  po,
  onClose,
}: {
  po: PurchaseOrderWithItems
  onClose: () => void
}) {
  const { data: locations } = useLocations()
  const receivePO = useReceivePurchaseOrder()

  const [locationId, setLocationId] = useState('')
  const [quantities, setQuantities] = useState<Record<string, number>>(
    Object.fromEntries(
      po.purchase_order_items.map((item) => [item.id, item.quantity_ordered - item.quantity_received])
    )
  )

  async function handleReceive() {
    if (!locationId) return

    const items = po.purchase_order_items
      .filter((item) => quantities[item.id] > 0)
      .map((item) => ({ item_id: item.id, quantity: quantities[item.id] }))

    await receivePO.mutateAsync({ po_id: po.id, location_id: locationId, items })
    onClose()
  }

  return (
    <div className="space-y-4">
      <div>
        <Label className="mb-1 block">Receiving Location</Label>
        <Select value={locationId} onValueChange={setLocationId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select a location" />
          </SelectTrigger>
          <SelectContent>
            {locations?.map((loc) => (
              <SelectItem key={loc.id} value={loc.id}>
                {loc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Quantities to Receive</Label>
        {po.purchase_order_items.map((item) => {
          const remaining = item.quantity_ordered - item.quantity_received
          return (
            <div key={item.id} className="flex items-center justify-between gap-3 border border-gray-100 rounded-lg p-3">
              <div>
                <p className="text-sm font-medium">{item.sku}</p>
                <p className="text-xs text-gray-500">{remaining} remaining of {item.quantity_ordered}</p>
              </div>
              <Input
                type="number"
                min={0}
                max={remaining}
                className="w-24"
                value={quantities[item.id] ?? 0}
                onChange={(e) =>
                  setQuantities((prev) => ({
                    ...prev,
                    [item.id]: Math.min(Number(e.target.value), remaining),
                  }))
                }
              />
            </div>
          )
        })}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleReceive}
          disabled={!locationId || receivePO.isPending}
        >
          {receivePO.isPending ? 'Receiving...' : 'Confirm Receipt'}
        </Button>
      </div>
    </div>
  )
}