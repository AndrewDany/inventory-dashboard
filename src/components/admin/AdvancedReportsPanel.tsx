import { useState } from 'react'
import { useValuationTrends, useTopMovers, useSupplierPerformance } from '../../hooks/useAdvancedReports'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

type ReportTab = 'valuation' | 'movers' | 'suppliers'

export default function AdvancedReportsPanel() {
  const [tab, setTab] = useState<ReportTab>('valuation')
  const { data: trends, isLoading: trendsLoading } = useValuationTrends()
  const { data: movers, isLoading: moversLoading } = useTopMovers()
  const { data: suppliers, isLoading: suppliersLoading } = useSupplierPerformance()

  const tabs: Array<{ key: ReportTab; label: string }> = [
    { key: 'valuation', label: 'Valuation Trends' },
    { key: 'movers', label: 'Top Movers' },
    { key: 'suppliers', label: 'Supplier Performance' },
  ]

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              tab === t.key
                ? 'bg-indigo-100 text-indigo-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'valuation' && (
        <div>
          {trendsLoading && <p className="text-sm text-gray-500">Loading valuation trends...</p>}
          {!trendsLoading && (!trends || trends.length === 0) && (
            <p className="text-sm text-gray-500">No valuation data yet. Run a valuation first.</p>
          )}
          {trends && trends.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead className="text-right">Total Units</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trends.map((t) => (
                  <TableRow key={t.month}>
                    <TableCell>
                      {new Date(t.month + '-01').toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      GHS {t.totalValue.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{t.totalUnits.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {tab === 'movers' && (
        <div>
          {moversLoading && <p className="text-sm text-gray-500">Loading top movers...</p>}
          {!moversLoading && (!movers || movers.length === 0) && (
            <p className="text-sm text-gray-500">No sales data available yet.</p>
          )}
          {movers && movers.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>SKU</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Total Sold</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {movers.map((m) => (
                  <TableRow key={m.sku}>
                    <TableCell className="font-mono text-xs">{m.sku}</TableCell>
                    <TableCell>{m.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{m.category ?? '—'}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{m.totalSold}</TableCell>
                    <TableCell className="text-right font-medium">
                      GHS {m.totalRevenue.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {tab === 'suppliers' && (
        <div>
          {suppliersLoading && <p className="text-sm text-gray-500">Loading supplier performance...</p>}
          {!suppliersLoading && (!suppliers || suppliers.length === 0) && (
            <p className="text-sm text-gray-500">No supplier data yet.</p>
          )}
          {suppliers && suppliers.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Supplier</TableHead>
                  <TableHead className="text-right">Total POs</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">On-Time Rate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((s) => (
                  <TableRow key={s.supplierName}>
                    <TableCell>{s.supplierName}</TableCell>
                    <TableCell className="text-right">{s.totalPOs}</TableCell>
                    <TableCell className="text-right">{s.completedPOs}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant={s.onTimeRate >= 80 ? 'default' : s.onTimeRate >= 50 ? 'secondary' : 'destructive'}
                      >
                        {s.onTimeRate.toFixed(0)}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}
    </div>
  )
}
