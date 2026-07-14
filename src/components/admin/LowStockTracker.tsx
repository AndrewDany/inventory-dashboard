import { useInventory } from '../../hooks/useInventory'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function LowStockTracker() {
  const { data: items, isLoading, error } = useInventory()

  if (isLoading) return <p className="text-gray-500 text-sm">Loading...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>

  const lowStockItems = (items ?? [])
    .filter((item) => item.quantity <= item.reorder_level)
    .sort((a, b) => a.quantity - b.quantity)

  if (lowStockItems.length === 0)
    return <p className="text-gray-500 text-sm">All items are above their reorder level.</p>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>SKU</TableHead>
          <TableHead>Current Qty</TableHead>
          <TableHead>Reorder Level</TableHead>
          <TableHead>Supplier</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lowStockItems.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.name}</TableCell>
            <TableCell className="text-gray-500">{item.sku}</TableCell>
            <TableCell>
              <Badge variant="destructive">{item.quantity}</Badge>
            </TableCell>
            <TableCell className="text-gray-600">{item.reorder_level}</TableCell>
            <TableCell className="text-gray-600">{item.supplier || '—'}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}