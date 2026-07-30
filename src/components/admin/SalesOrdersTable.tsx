import { useState } from 'react'
import { useSalesOrders, useShipSalesOrder } from '../../hooks/useSalesOrders'
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [shippingSO, setShippingSO] = useState<{ id: string; locationId: string } | null>(null)
  const [shipLocationId, setShipLocationId] = useState('')

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
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShippingSO(null); setShipLocationId('') }}>
                Cancel
              </Button>
              <Button
                onClick={handleShip}
                disabled={!shipLocationId || shipOrder.isPending}
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