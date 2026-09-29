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
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="whitespace-nowrap">Item</TableHead>
            <TableHead className="whitespace-nowrap">SKU</TableHead>
            <TableHead className="whitespace-nowrap">Type</TableHead>
            <TableHead className="whitespace-nowrap">Brand</TableHead>
            <TableHead className="whitespace-nowrap">Color</TableHead>
            <TableHead className="whitespace-nowrap">Size</TableHead>
            <TableHead className="whitespace-nowrap">Current Qty</TableHead>
            <TableHead className="whitespace-nowrap">Reorder Level</TableHead>
            <TableHead className="whitespace-nowrap">Supplier</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {lowStockItems.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="font-medium whitespace-nowrap">{item.name}</TableCell>
              <TableCell className="text-gray-500 font-mono text-xs whitespace-nowrap">{item.sku}</TableCell>
              <TableCell className="text-gray-600 whitespace-nowrap">{item.type || '—'}</TableCell>
              <TableCell className="text-gray-600 whitespace-nowrap">{item.brand || '—'}</TableCell>
              <TableCell className="text-gray-600 whitespace-nowrap">{item.color || '—'}</TableCell>
              <TableCell className="text-gray-600 whitespace-nowrap">{item.size || '—'}</TableCell>
              <TableCell>
                <Badge variant="destructive">{item.quantity}</Badge>
              </TableCell>
              <TableCell className="text-gray-600">{item.reorder_level}</TableCell>
              <TableCell className="text-gray-600 whitespace-nowrap">{item.supplier || '—'}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}