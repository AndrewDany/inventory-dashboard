import { useState } from 'react'
import { Search } from 'lucide-react'
import { useInventoryBatches } from '../../hooks/useInventoryBatches'
import { useLocations } from '../../hooks/useLocations'
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

export default function InventoryBatchesTable() {
  const [skuFilter, setSkuFilter] = useState('')
  const { data: batches, isLoading, error } = useInventoryBatches(skuFilter || undefined)
  const { data: locations } = useLocations()

  const locationName = (id: string | null) => {
    if (!id) return '—'
    const match = locations?.find((loc) => loc.id === id)
    return match ? match.name : '—'
  }

  if (isLoading) return <p className="text-gray-500 text-sm">Loading batch data...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Filter by SKU..."
            value={skuFilter}
            onChange={(e) => setSkuFilter(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>

      {(!batches || batches.length === 0) && (
        <p className="text-gray-500 text-sm">
          {skuFilter ? 'No batches found for this SKU.' : 'No batch stock data available yet. Receive a purchase order to create batches.'}
        </p>
      )}

      {batches && batches.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Batch Code</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>On Hand</TableHead>
              <TableHead>Avg Unit Cost</TableHead>
              <TableHead>Total Value</TableHead>
              <TableHead>Expiry</TableHead>
              <TableHead>Received</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {batches.map((row) => {
              const batch = row.inventory_batches
              const totalValue = (row.on_hand_quantity ?? 0) * (row.avg_unit_cost ?? 0)
              return (
                <TableRow key={row.id}>
                  <TableCell className="font-medium">{batch.sku}</TableCell>
                  <TableCell className="font-mono text-xs">{batch.batch_code}</TableCell>
                  <TableCell className="text-gray-600">{locationName(row.location_id)}</TableCell>
                  <TableCell>
                    <Badge variant="default">{row.on_hand_quantity}</Badge>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {row.avg_unit_cost != null ? `GHS ${row.avg_unit_cost.toFixed(2)}` : '—'}
                  </TableCell>
                  <TableCell className="font-medium">
                    GHS {totalValue.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {new Date(batch.received_date).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}