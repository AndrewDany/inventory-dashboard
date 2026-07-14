import { useActivityLogs } from '../../hooks/useActivityLogs'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const actionVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  created: 'default',
  updated: 'secondary',
  deleted: 'destructive',
}

export default function ActivityLogsTable() {
  const { data: logs, isLoading, error } = useActivityLogs()

  if (isLoading) return <p className="text-gray-500 text-sm">Loading activity...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>
  if (!logs || logs.length === 0) return <p className="text-gray-500 text-sm">No activity yet.</p>

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Action</TableHead>
          <TableHead>Item</TableHead>
          <TableHead>User</TableHead>
          <TableHead>When</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {logs.map((log) => (
          <TableRow key={log.id}>
            <TableCell>
              <Badge variant={actionVariant[log.action]} className="capitalize">
                {log.action}
              </Badge>
            </TableCell>
            <TableCell>{log.item_name}</TableCell>
            <TableCell className="text-gray-600">{log.user_email}</TableCell>
            <TableCell className="text-gray-500">
              {new Date(log.created_at).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}