import { useMemo, useState } from 'react'
import { useSalesOrders, useShipSalesOrder } from '../../hooks/useSalesOrders'
import { useInventory } from '../../hooks/useInventory'
import { useInventoryBatches } from '../../hooks/useInventoryBatches'
import { useLocations } from '../../hooks/useLocations'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Modal from '../ui/Modal'
import { Label } from '@/components/ui/label'

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  draft: 'secondary',
  confirmed: 'secondary',
  shipped: 'default',
  cancelled: 'destructive',
}

export default function SalesOrdersTable() {
  const { data: orders, isLoading, error } = useSalesOrders()
  const shipOrder = useShipSalesOrder()
  const { data: locations } = useLocations()
  const { data: inventoryItems = [] } = useInventory()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [shippingSO, setShippingSO] = useState<{ id: string; locationId: string } | null>(null)
  const [shipLocationId, setShipLocationId] = useState('')

  const { data: locationBatches } = useInventoryBatches(undefined, shipLocationId || undefined)
  const selectedOrder = shippingSO ? orders?.find((so) => so.id === shippingSO.id) : null

  const availableBySku = useMemo(() => {
    const qtyBySku: Record<string, number> = {}

    for (const row of locationBatches ?? []) {
      const sku = row.inventory_batches.sku
      qtyBySku[sku] = (qtyBySku[sku] ?? 0) + Number(row.on_hand_quantity ?? 0)
    }

    for (const item of inventoryItems) {
      const sku = item.sku
      qtyBySku[sku] = (qtyBySku[sku] ?? 0) + Number(item.quantity ?? 0)
    }

    return qtyBySku
  }, [locationBatches, inventoryItems])

  const shortages = useMemo(() => {
    if (!selectedOrder) return []

    return selectedOrder.sales_order_items
      .map((item) => {
        const remaining = item.quantity_ordered - item.quantity_shipped
        const available = availableBySku[item.sku] ?? 0
        return {
          sku: item.sku,
          required: remaining,
          available,
          shortage: Math.max(0, remaining - available),
        }
      })
      .filter((item) => item.shortage > 0)
  }, [selectedOrder, availableBySku])

  const hasShortage = shortages.length > 0
  const selectedLocationName = locations?.find((loc) => loc.id === shipLocationId)?.name

  if (isLoading) return <p className="text-gray-500 text-sm">Loading sales orders...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>

  if (!orders || orders.length === 0) {
    return <p className="text-gray-500 text-sm">No sales orders yet — create one from Point of Sale.</p>
  }

  async function handleShip() {
    if (!shippingSO || !shipLocationId) return
    await shipOrder.mutateAsync({ so_id: shippingSO.id, location_id: shipLocationId })
    setShippingSO(null)
    setShipLocationId('')
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SO Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Lines</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((so) => (
            <>
              <TableRow key={so.id}>
                <TableCell className="font-medium">{so.so_number}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant[so.status]} className="capitalize">
                    {so.status}
                  </Badge>
                </TableCell>
                <TableCell>{so.sales_order_items.length} item(s)</TableCell>
                <TableCell className="text-gray-500">
                  {new Date(so.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === so.id ? null : so.id)}
                  >
                    {expandedId === so.id ? 'Hide' : 'View'} Lines
                  </Button>
                  {so.status !== 'shipped' && so.status !== 'cancelled' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShippingSO({ id: so.id, locationId: '' })}
                    >
                      Ship
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              {expandedId === so.id && (
                <TableRow key={`${so.id}-detail`}>
                  <TableCell colSpan={5} className="bg-gray-50">
                    <div className="text-sm space-y-1 py-2">
                      {so.sales_order_items.map((item) => (
                        <div key={item.id} className="flex justify-between text-gray-600">
                          <span>{item.sku}</span>
                          <span>
                            {item.quantity_shipped} / {item.quantity_ordered} shipped
                            {item.unit_price != null && ` · GHS ${item.unit_price.toFixed(2)} ea`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>

      {shippingSO && (
        <Modal title="Ship Sales Order" onClose={() => { setShippingSO(null); setShipLocationId('') }}>
          <div className="space-y-4">
            <div>
              <Label className="mb-1 block">Ship from Location</Label>
              <Select
                value={shipLocationId}
                onValueChange={(v) => setShipLocationId(v ?? '')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a location">
                    {(value: string) => locations?.find((loc) => loc.id === value)?.name ?? value}
                  </SelectValue>
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
            <p className="text-sm text-gray-500">
              This will ship <strong>all remaining items</strong> on this order. Use POS for partial shipments.
            </p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
              <p className="font-semibold">Available stock at {selectedLocationName ?? 'selected location'}:</p>
              <ul className="mt-2 list-disc pl-5 space-y-1">
                {selectedOrder?.sales_order_items.map((item) => (
                  <li key={item.id}>
                    {item.sku}: {availableBySku[item.sku] ?? 0} available · {item.quantity_ordered - item.quantity_shipped} needed
                  </li>
                ))}
              </ul>
            </div>
            {hasShortage && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                <p className="font-semibold">Insufficient stock at the selected location:</p>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  {shortages.map((item) => (
                    <li key={item.sku}>
                      {item.sku}: required {item.required}, available {item.available}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShippingSO(null); setShipLocationId('') }}>
                Cancel
              </Button>
              <Button
                onClick={handleShip}
                disabled={!shipLocationId || shipOrder.isPending || hasShortage}
              >
                {shipOrder.isPending ? 'Shipping...' : 'Confirm Shipment'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}