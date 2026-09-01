import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useReturns, useProcessReturn, useCancelReturn } from '../../hooks/useReturns'
import { useLocations } from '../../hooks/useLocations'
import { useSuppliers } from '../../hooks/useSuppliers'
import {
  RETURN_TYPE_LABELS,
  REASON_LABELS,
  RESOLUTION_LABELS,
  RESOLUTION_BADGE_VARIANT,
} from '../../types/returns'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Modal from '../ui/Modal'
import ReturnForm from './ReturnForm'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  pending: 'secondary',
  completed: 'default',
  cancelled: 'destructive',
}

const typeVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  customer_return: 'default',
  damaged_stock: 'destructive',
  supplier_return: 'secondary',
}

const STATUS_FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

export default function ReturnsTable() {
  const { data: returns, isLoading, error } = useReturns()
  const { data: locations } = useLocations()
  const { data: suppliers } = useSuppliers()
  const processReturn = useProcessReturn()
  const cancelReturn = useCancelReturn()
  const [showForm, setShowForm] = useState(false)
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'cancelled'>('all')

  const locationName = useMemo(() => {
    const map = new Map<string, string>()
    locations?.forEach((loc) => map.set(loc.id, loc.name))
    return (id: string) => map.get(id) ?? '—'
  }, [locations])

  const supplierName = useMemo(() => {
    const map = new Map<string, string>()
    suppliers?.forEach((s) => map.set(s.id, s.name))
    return (id: string | null) => (id ? map.get(id) ?? '—' : '—')
  }, [suppliers])

  const filtered = useMemo(() => {
    if (!returns) return []
    if (statusFilter === 'all') return returns
    return returns.filter((r) => r.status === statusFilter)
  }, [returns, statusFilter])

  const counts = useMemo(() => {
    return {
      all: returns?.length ?? 0,
      pending: returns?.filter((r) => r.status === 'pending').length ?? 0,
      completed: returns?.filter((r) => r.status === 'completed').length ?? 0,
      cancelled: returns?.filter((r) => r.status === 'cancelled').length ?? 0,
    }
  }, [returns])

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <Button
              key={f.value}
              size="sm"
              variant={statusFilter === f.value ? 'default' : 'outline'}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
              <span className="ml-1.5 rounded-full bg-white/20 px-1.5 text-[10px] font-semibold">
                {counts[f.value]}
              </span>
            </Button>
          ))}
        </div>
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} className="mr-1" /> Log Return / Replacement
        </Button>
      </div>

      {isLoading && <p className="text-gray-500 text-sm">Loading returns...</p>}
      {error && <p className="text-red-600 text-sm">Error: {error.message}</p>}
      {!isLoading && !error && filtered.length === 0 && (
        <p className="text-gray-500 text-sm">No returns in this view yet — log your first one.</p>
      )}

      {!isLoading && !error && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Return #</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Resolution</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead>Customer / Supplier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium whitespace-nowrap">{r.return_number}</TableCell>
                  <TableCell>
                    <Badge variant={typeVariant[r.return_type]}>{RETURN_TYPE_LABELS[r.return_type]}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{r.sku}</TableCell>
                  <TableCell>{r.quantity}</TableCell>
                  <TableCell className="whitespace-nowrap">{locationName(r.location_id)}</TableCell>
                  <TableCell className="text-gray-600 whitespace-nowrap">{REASON_LABELS[r.reason]}</TableCell>
                  <TableCell>
                    <Badge variant={RESOLUTION_BADGE_VARIANT[r.resolution]}>
                      {RESOLUTION_LABELS[r.resolution]}
                    </Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.resolution === 'refund' ? (
                      r.refund_amount != null ? (
                        <span className="inline-flex items-center gap-1.5">
                          GHS {r.refund_amount.toFixed(2)}
                          {r.refund_amount_estimated && (
                            <Badge variant="outline" className="text-[10px]">Est.</Badge>
                          )}
                        </span>
                      ) : (
                        <span className="text-amber-600 text-xs">Needs amount</span>
                      )
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {r.return_type === 'supplier_return'
                      ? supplierName(r.supplier_id)
                      : r.customer_name ?? '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[r.status]} className="capitalize">
                      {r.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {r.status === 'pending' && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => processReturn.mutate(r.id)}
                            disabled={processReturn.isPending}
                          >
                            Process
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => cancelReturn.mutate(r.id)}
                            disabled={cancelReturn.isPending}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {showForm && (
        <Modal title="Log Return / Replacement" onClose={() => setShowForm(false)}>
          <ReturnForm onClose={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}