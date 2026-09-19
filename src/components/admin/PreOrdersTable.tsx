import React, { useMemo, useState } from 'react'
import { usePreOrders, useShipSalesOrder, useRecordPreOrderPayment } from '../../hooks/useSalesOrders'
import { useInventory } from '../../hooks/useInventory'
import { useInventoryBatches } from '../../hooks/useInventoryBatches'
import { useLocations } from '../../hooks/useLocations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { StatusBadge } from '@/components/ui/status-badge'
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

function orderTotal(so: { sales_order_items: { quantity_ordered: number; unit_price: number | null }[] }) {
  return so.sales_order_items.reduce(
    (sum, item) => sum + item.quantity_ordered * (item.unit_price ?? 0),
    0
  )
}

export default function PreOrdersTable() {
  const { data: orders, isLoading, error } = usePreOrders()
  const shipOrder = useShipSalesOrder()
  const recordPayment = useRecordPreOrderPayment()
  const { data: locations } = useLocations()
  const { data: inventoryItems = [] } = useInventory()
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [shippingSO, setShippingSO] = useState<{ id: string } | null>(null)
  const [shipLocationId, setShipLocationId] = useState('')
  const [payingSO, setPayingSO] = useState<{ id: string; balance: number } | null>(null)
  const [paymentAmount, setPaymentAmount] = useState('')

  const { data: locationBatches } = useInventoryBatches(undefined, shipLocationId || undefined)
  const { data: allBatches } = useInventoryBatches()
  const selectedOrder = shippingSO ? orders?.find((so) => so.id === shippingSO.id) : null

  // Same location-scoped availability logic as the main Sales Orders
  // Fulfill flow -- see SalesOrdersTable.tsx for the full reasoning.
  const availableBySku = useMemo(() => {
    const qtyBySku: Record<string, number> = {}
    const batchTrackedSkus = new Set<string>()

    for (const row of allBatches ?? []) {
      batchTrackedSkus.add(row.inventory_batches.sku)
    }
    for (const row of locationBatches ?? []) {
      const sku = row.inventory_batches.sku
      qtyBySku[sku] = (qtyBySku[sku] ?? 0) + Number(row.on_hand_quantity ?? 0)
    }
    for (const item of inventoryItems) {
      if (batchTrackedSkus.has(item.sku)) continue
      if (!shipLocationId || item.location_id !== shipLocationId) continue
      qtyBySku[item.sku] = (qtyBySku[item.sku] ?? 0) + Number(item.quantity ?? 0)
    }
    return qtyBySku
  }, [locationBatches, allBatches, inventoryItems, shipLocationId])

  const shortages = useMemo(() => {
    if (!selectedOrder) return []
    return selectedOrder.sales_order_items
      .map((item) => {
        const remaining = item.quantity_ordered - item.quantity_shipped
        const available = availableBySku[item.sku] ?? 0
        return { sku: item.sku, required: remaining, available, shortage: Math.max(0, remaining - available) }
      })
      .filter((item) => item.shortage > 0)
  }, [selectedOrder, availableBySku])

  const hasShortage = shortages.length > 0
  const selectedLocationName = locations?.find((loc) => loc.id === shipLocationId)?.name

  if (isLoading) return <p className="text-gray-500 text-sm">Loading pre-orders...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>

  if (!orders || orders.length === 0) {
    return (
      <p className="text-gray-500 text-sm">
        No pre-orders yet — use "New Pre-Order" above when a client calls in.
      </p>
    )
  }

  async function handleShip() {
    if (!shippingSO || !shipLocationId) return
    await shipOrder.mutateAsync({ so_id: shippingSO.id, location_id: shipLocationId })
    setShippingSO(null)
    setShipLocationId('')
  }

  async function handleRecordPayment() {
    if (!payingSO) return
    const amount = Number(paymentAmount)
    if (!amount || amount <= 0) return
    await recordPayment.mutateAsync({ so_id: payingSO.id, amount })
    setPayingSO(null)
    setPaymentAmount('')
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Client</TableHead>
            <TableHead>Fulfillment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((so) => {
            const total = orderTotal(so)
            const paid = Number(so.amount_paid) || 0
            const balance = Math.max(0, total - paid)
            const currency = so.sales_order_items[0]?.currency ?? 'GHS'

            return (
              <React.Fragment key={so.id}>
                <TableRow className="hover:bg-slate-50">
                  <TableCell className="font-medium">{so.so_number}</TableCell>
                  <TableCell>
                    <div className="text-slate-900">{so.customer_name ?? '—'}</div>
                    <div className="text-xs text-gray-500">{so.customer_phone ?? ''}</div>
                  </TableCell>
                  <TableCell className="capitalize">
                    {so.fulfillment_method}
                    {so.fulfillment_method === 'delivery' && so.delivery_address && (
                      <div className="text-xs text-gray-500">{so.delivery_address}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={so.status} />
                  </TableCell>
                  <TableCell className="text-right font-semibold text-slate-900">
                    {currency} {total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right text-emerald-700">
                    {currency} {paid.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    {balance > 0 ? (
                      <span className="text-amber-700 font-medium">{currency} {balance.toFixed(2)}</span>
                    ) : (
                      <span className="text-emerald-700 font-medium">Paid in full</span>
                    )}
                  </TableCell>
                  <TableCell className="space-x-2 whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedId(expandedId === so.id ? null : so.id)}
                    >
                      {expandedId === so.id ? 'Hide' : 'View'} Lines
                    </Button>
                    {balance > 0 && so.status !== 'cancelled' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPayingSO({ id: so.id, balance })}
                      >
                        Record Payment
                      </Button>
                    )}
                    {so.status !== 'shipped' && so.status !== 'cancelled' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShippingSO({ id: so.id })}
                      >
                        Fulfill
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
                {expandedId === so.id && (
                  <TableRow>
                    <TableCell colSpan={8} className="bg-gray-50">
                      <div className="text-sm space-y-1 py-2">
                        {so.sales_order_items.map((item) => (
                          <div key={item.id} className="flex justify-between text-gray-600">
                            <span>{item.sku}</span>
                            <span>
                              {item.quantity_shipped} / {item.quantity_ordered} fulfilled
                              {item.unit_price != null && ` · GHS ${item.unit_price.toFixed(2)} ea`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            )
          })}
        </TableBody>
      </Table>

      {payingSO && (
        <Modal title="Record Payment" onClose={() => { setPayingSO(null); setPaymentAmount('') }}>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Balance due: <strong>GHS {payingSO.balance.toFixed(2)}</strong>
            </p>
            <div>
              <Label htmlFor="payment-amount" className="mb-1 block">Amount received</Label>
              <Input
                id="payment-amount"
                type="number"
                min="0"
                step="0.01"
                max={payingSO.balance}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setPayingSO(null); setPaymentAmount('') }}>
                Cancel
              </Button>
              <Button
                onClick={handleRecordPayment}
                disabled={!paymentAmount || Number(paymentAmount) <= 0 || recordPayment.isPending}
              >
                {recordPayment.isPending ? 'Saving...' : 'Confirm Payment'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {shippingSO && (
        <Modal title="Fulfill Pre-Order" onClose={() => { setShippingSO(null); setShipLocationId('') }}>
          <div className="space-y-4">
            {selectedOrder && Number(selectedOrder.amount_paid) < orderTotal(selectedOrder) && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                This order still has a balance of GHS{' '}
                {(orderTotal(selectedOrder) - Number(selectedOrder.amount_paid)).toFixed(2)} outstanding.
                Confirm with the client before handing over goods.
              </div>
            )}
            <div>
              <Label className="mb-1 block">Fulfill from Location</Label>
              <Select value={shipLocationId} onValueChange={(v) => setShipLocationId(v ?? '')}>
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
                    <li key={item.sku}>{item.sku}: required {item.required}, available {item.available}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => { setShippingSO(null); setShipLocationId('') }}>
                Cancel
              </Button>
              <Button onClick={handleShip} disabled={!shipLocationId || shipOrder.isPending || hasShortage}>
                {shipOrder.isPending ? 'Fulfilling...' : 'Confirm Fulfillment'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
