import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useInventoryAdjustments } from '../../hooks/useInventoryAdjustments'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Modal from '../ui/Modal'
import AdjustmentForm from './AdjustmentForm'

const reasonLabels: Record<string, string> = {
  manual_add: 'Manual Add',
  manual_remove: 'Manual Remove',
  cycle_count: 'Cycle Count',
  write_off: 'Write Off',
  other: 'Other',
}

export default function AdjustmentsTable() {
  const { data: adjustments, isLoading, error } = useInventoryAdjustments()
  const [showForm, setShowForm] = useState(false)

  if (isLoading) return <p className="text-gray-500 text-sm">Loading adjustments...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus size={14} className="mr-1" /> New Adjustment
        </Button>
      </div>

      {(!adjustments || adjustments.length === 0) && (
        <p className="text-gray-500 text-sm">No adjustments yet — apply your first one.</p>
      )}

      {adjustments && adjustments.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Adjustment #</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adjustments.map((adj) => (
              <TableRow key={adj.id}>
                <TableCell className="font-mono text-sm">{adj.adjustment_number}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{reasonLabels[adj.reason] ?? adj.reason}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={adj.status === 'applied' ? 'default' : 'secondary'} className="capitalize">
                    {adj.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  {new Date(adj.created_at).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {showForm && (
        <Modal title="Apply Inventory Adjustment" onClose={() => setShowForm(false)}>
          <AdjustmentForm onClose={() => setShowForm(false)} />
        </Modal>
      )}
    </div>
  )
}

