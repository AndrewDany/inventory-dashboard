import { useStockMovements } from '../../hooks/useStockMovements'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function StockMovementsTable() {
  const { data: movements, isLoading, error } = useStockMovements()

  if (isLoading) return <p className="text-gray-500 text-sm">Loading stock movements...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>
  if (!movements || movements.length === 0)
    return <p className="text-gray-500 text-sm">No stock changes recorded yet.</p>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Item</TableHead>
          <TableHead>Change</TableHead>
          <TableHead>Before → After</TableHead>
          <TableHead>User</TableHead>
          <TableHead>When</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {movements.map((m) => (
          <TableRow key={m.id}>
            <TableCell>{m.item_name}</TableCell>
            <TableCell>
              <Badge variant={m.change_amount > 0 ? 'default' : 'destructive'}>
                {m.change_amount > 0 ? `+${m.change_amount}` : m.change_amount}
              </Badge>
            </TableCell>
            <TableCell className="text-gray-600">
              {m.previous_quantity} → {m.new_quantity}
            </TableCell>
            <TableCell className="text-gray-600">{m.user_email}</TableCell>
            <TableCell className="text-gray-500">{new Date(m.created_at).toLocaleString()}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}