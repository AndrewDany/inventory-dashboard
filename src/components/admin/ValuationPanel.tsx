import { useValuationRuns, useRecomputeValuation } from '../../hooks/useValuation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export default function ValuationPanel() {
  const { data: runs, isLoading, error } = useValuationRuns()
  const recompute = useRecomputeValuation()

  if (isLoading) return <p className="text-gray-500 text-sm">Loading valuation data...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          size="sm"
          onClick={() => recompute.mutate(undefined)}
          disabled={recompute.isPending}
        >
          {recompute.isPending ? 'Recomputing...' : 'Recompute Valuation'}
        </Button>
      </div>

      {(!runs || runs.length === 0) && (
        <p className="text-gray-500 text-sm">
          No valuation runs yet. Click "Recompute Valuation" to create your first one.
        </p>
      )}

      {runs && runs.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Method</TableHead>
              <TableHead>Started</TableHead>
              <TableHead>Finished</TableHead>
              <TableHead>Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {runs.map((run) => (
              <TableRow key={run.id}>
                <TableCell>
                  <Badge variant="secondary" className="uppercase">{run.costing_method}</Badge>
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {new Date(run.started_at).toLocaleString()}
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  {run.finished_at ? new Date(run.finished_at).toLocaleString() : (
                    <span className="text-amber-600 italic">In progress...</span>
                  )}
                </TableCell>
                <TableCell className="text-gray-600 text-sm max-w-xs truncate">
                  {run.notes || '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

