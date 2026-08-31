import React, { useState } from 'react'
import { usePurchaseOrders } from '../../hooks/usePurchaseOrders'
import { Button } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Modal from '../ui/Modal'
import ReceivePOModal from './ReceivePOModal'
import type { PurchaseOrderWithItems } from '../../hooks/usePurchaseOrders'

function orderTotal(po: { purchase_order_items: { quantity_ordered: number; unit_cost: number | null }[] }) {
  return po.purchase_order_items.reduce(
    (sum, item) => sum + item.quantity_ordered * (item.unit_cost ?? 0),
    0
  )
}

export default function PurchaseOrdersTable() {
  const { data: pos, isLoading, error } = usePurchaseOrders()
  const [receivingPO, setReceivingPO] = useState<PurchaseOrderWithItems | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (isLoading) return <p className="text-gray-500 text-sm">Loading purchase orders...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>
  if (!pos || pos.length === 0) return <p className="text-gray-500 text-sm">No purchase orders yet — add one from the sidebar.</p>

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>PO Number</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Lines</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pos.map((po) => (
            <React.Fragment key={po.id}>
              <TableRow className="hover:bg-slate-50">
                <TableCell className="font-medium">{po.po_number}</TableCell>
                <TableCell>
                  <StatusBadge status={po.status} />
                </TableCell>
                <TableCell>{po.purchase_order_items.length} item(s)</TableCell>
                <TableCell className="text-gray-500">
                  {new Date(po.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right font-semibold text-slate-900">
                  {po.purchase_order_items[0]?.currency ?? 'GHS'} {orderTotal(po).toFixed(2)}
                </TableCell>
                <TableCell className="space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedId(expandedId === po.id ? null : po.id)}
                  >
                    {expandedId === po.id ? 'Hide' : 'View'} Lines
                  </Button>
                  {po.status !== 'received' && po.status !== 'cancelled' && (
                    <Button variant="ghost" size="sm" onClick={() => setReceivingPO(po)}>
                      Receive
                    </Button>
                  )}
                </TableCell>
              </TableRow>
              {expandedId === po.id && (
                <TableRow>
                  <TableCell colSpan={6} className="bg-gray-50">
                    <div className="text-sm space-y-1 py-2">
                      {po.purchase_order_items.map((item) => (
                        <div key={item.id} className="flex justify-between text-gray-600">
                          <span>{item.sku}</span>
                          <span>
                            {item.quantity_received} / {item.quantity_ordered} received
                            {item.unit_cost != null && ` · GHS ${item.unit_cost.toFixed(2)} ea`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </React.Fragment>
          ))}
        </TableBody>
      </Table>

      {receivingPO && (
        <Modal title={`Receive PO ${receivingPO.po_number}`} onClose={() => setReceivingPO(null)}>
          <ReceivePOModal po={receivingPO} onClose={() => setReceivingPO(null)} />
        </Modal>
      )}
    </div>
  )
}