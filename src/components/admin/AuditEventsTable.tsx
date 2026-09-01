import { useState } from 'react'
import { Search, PackageCheck, Truck, SlidersHorizontal, Activity } from 'lucide-react'
import { useAuditEvents } from '../../hooks/useAuditEvents'
import { relativeTime } from '../../lib/relativeTime'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const EVENT_TYPE_META: Record<string, { label: string; icon: typeof Activity; bg: string; text: string }> = {
  purchase_order_received: { label: 'PO Received', icon: PackageCheck, bg: 'bg-indigo-50', text: 'text-indigo-700' },
  sales_order_shipped: { label: 'SO Shipped', icon: Truck, bg: 'bg-blue-50', text: 'text-blue-700' },
  inventory_adjustment: { label: 'Adjustment', icon: SlidersHorizontal, bg: 'bg-amber-50', text: 'text-amber-700' },
}

const DEFAULT_META = { icon: Activity, bg: 'bg-slate-100', text: 'text-slate-600' }

function eventMeta(eventType: string) {
  return EVENT_TYPE_META[eventType] ?? { ...DEFAULT_META, label: eventType }
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

  const counts = (events ?? []).reduce<Record<string, number>>((acc, ev) => {
    acc[ev.event_type] = (acc[ev.event_type] ?? 0) + 1
    return acc
  }, {})

  return (
    <div>
      {events && events.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            <Activity size={12} /> {events.length} total
          </span>
          {Object.entries(counts).map(([type, count]) => {
            const meta = eventMeta(type)
            const Icon = meta.icon
            return (
              <span
                key={type}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.bg} ${meta.text}`}
              >
                <Icon size={12} /> {meta.label ?? type} &middot; {count}
              </span>
            )
          })}
        </div>
      )}

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
        <div className="overflow-x-auto rounded-lg border border-slate-100">
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
              {filtered.map((ev) => {
                const meta = eventMeta(ev.event_type)
                const Icon = meta.icon
                const delta = ev.quantity_delta ?? 0
                return (
                  <TableRow key={ev.id} className="hover:bg-slate-50">
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.bg} ${meta.text}`}
                      >
                        <Icon size={12} /> {meta.label ?? ev.event_type}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {ev.entity_type ? `${ev.entity_type.slice(0, 20)}` : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{ev.sku || '—'}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          delta > 0
                            ? 'bg-emerald-50 text-emerald-700'
                            : delta < 0
                              ? 'bg-rose-50 text-rose-700'
                              : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {ev.unit_cost != null ? `GHS ${ev.unit_cost.toFixed(2)}` : '—'}
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {ev.actor_user_email || '—'}
                    </TableCell>
                    <TableCell
                      className="text-slate-400 text-sm whitespace-nowrap"
                      title={new Date(ev.created_at).toLocaleString()}
                    >
                      {relativeTime(ev.created_at)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}