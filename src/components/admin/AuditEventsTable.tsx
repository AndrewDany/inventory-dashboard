import { useState } from 'react'
import { Search } from 'lucide-react'
import { useAuditEvents } from '../../hooks/useAuditEvents'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const eventTypeLabels: Record<string, string> = {
  purchase_order_received: 'PO Received',
  sales_order_shipped: 'SO Shipped',
  inventory_adjustment: 'Adjustment',
}

export default function AuditEventsTable() {
  const [search, setSearch] = useState('')
  const { data: events, isLoading, error } = useAuditEvents(100)

  if (isLoading) return <p className="text-gray-500 text-sm">Loading audit events...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>

  const filtered = (events ?? []).filter((ev) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      ev.event_type.toLowerCase().includes(q) ||
      (ev.sku ?? '').toLowerCase().includes(q) ||
      (ev.actor_user_email ?? '').toLowerCase().includes(q) ||
      (ev.entity_type ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by event type, SKU, or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-8"
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-500 text-sm">
          {events && events.length === 0
            ? 'No audit events yet. Events are recorded when POs are received, SOs are shipped, or adjustments are applied.'
            : 'No events match your search.'}
        </p>
      )}

      {filtered.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Event</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Qty Delta</TableHead>
                <TableHead>Unit Cost</TableHead>
                <TableHead>User</TableHead>
                <TableHead>When</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((ev) => (
                <TableRow key={ev.id}>
                  <TableCell>
                    <Badge variant="secondary">
                      {eventTypeLabels[ev.event_type] ?? ev.event_type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {ev.entity_type ? `${ev.entity_type.slice(0, 20)}` : '—'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">{ev.sku || '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant={(ev.quantity_delta ?? 0) > 0 ? 'default' : 'destructive'}
                    >
                      {(ev.quantity_delta ?? 0) > 0 ? `+${ev.quantity_delta}` : ev.quantity_delta ?? 0}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {ev.unit_cost != null ? `GHS ${ev.unit_cost.toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell className="text-gray-600 text-sm">
                    {ev.actor_user_email || '—'}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                    {new Date(ev.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}

