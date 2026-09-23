import { useState } from 'react'
import { useValuationTrends, useTopMovers, useSupplierPerformance } from '../../hooks/useAdvancedReports'
import { useMonthlyFinancials } from '../../hooks/useMonthlyFinancials'
import { useSalesOrders } from '../../hooks/useSalesOrders'
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

type ReportTab = 'monthly-sales' | 'valuation' | 'movers' | 'suppliers'

export default function AdvancedReportsPanel() {
  const [tab, setTab] = useState<ReportTab>('valuation')
  const { data: trends, isLoading: trendsLoading } = useValuationTrends()
  const { data: movers, isLoading: moversLoading } = useTopMovers()
  const { data: suppliers, isLoading: suppliersLoading } = useSupplierPerformance()
  const { data: monthly, isLoading: monthlyLoading } = useMonthlyFinancials()
  const { data: orders = [], isLoading: ordersLoading } = useSalesOrders()
  const [selectedMonth, setSelectedMonth] = useState('')

  const tabs: Array<{ key: ReportTab; label: string }> = [
    { key: 'monthly-sales', label: 'Monthly Sales' },
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

      {tab === 'monthly-sales' && (
        <MonthlySalesReport
          monthly={monthly ?? []}
          orders={orders}
          isLoading={monthlyLoading || ordersLoading}
          selectedMonth={selectedMonth || monthly?.at(-1)?.month || ''}
          onSelectMonth={setSelectedMonth}
        />
      )}

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

function MonthlySalesReport({
  monthly,
  orders,
  isLoading,
  selectedMonth,
  onSelectMonth,
}: {
  monthly: Array<{
    month: string
    grossSales: number
    refunds: number
    netSales: number
    cogs: number
    grossProfit: number
    expenses: number
    netProfit: number
  }>
  orders: Array<{
    so_number: string
    customer_name: string | null
    created_at: string
    status: string
    sales_order_items: Array<{ sku: string; quantity_shipped: number; unit_price: number | null }>
  }>
  isLoading: boolean
  selectedMonth: string
  onSelectMonth: (month: string) => void
}) {
  const selected = monthly.find((row) => row.month === selectedMonth) ?? monthly.at(-1)

  function exportMonthlyCsv() {
    if (!selected) return
    const headers = ['Month', 'Gross Sales', 'Refunds', 'Net Sales', 'COGS', 'Gross Profit', 'Expenses', 'Net Profit']
    const values = [selected.month, selected.grossSales, selected.refunds, selected.netSales, selected.cogs, selected.grossProfit, selected.expenses, selected.netProfit]
    const csv = `${headers.join(',')}\n${values.join(',')}\n`
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `monthly-sales-${selected.month}.csv`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  function exportTransactionCsv() {
    const transactions = monthlyTransactions(orders, selectedMonth)
    if (transactions.length === 0) return
    const headers = ['Date', 'Transaction', 'Customer', 'SKU', 'Quantity', 'Unit Price (GHS)', 'Total (GHS)', 'Status']
    const csv = [headers, ...transactions.map((transaction) => [
      transaction.date,
      transaction.transaction,
      transaction.customer,
      transaction.sku,
      transaction.quantity,
      transaction.unitPrice.toFixed(2),
      transaction.total.toFixed(2),
      transaction.status,
    ])].map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `transactions-${selectedMonth || 'month'}.csv`
    link.click()
    window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  if (isLoading) return <p className="text-sm text-gray-500">Loading monthly sales...</p>
  if (!selected || monthly.length === 0) return <p className="text-sm text-gray-500">No monthly sales data available yet.</p>

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900">Full-month sales report</p>
          <p className="mt-1 text-xs text-slate-500">Totals include completed shipped sales, refunds, cost of goods, and expenses.</p>
        </div>
        <div className="flex gap-2">
          <select className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm" value={selected.month} onChange={(event) => onSelectMonth(event.target.value)}>
            {monthly.map((row) => <option key={row.month} value={row.month}>{new Date(`${row.month}-01`).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</option>)}
          </select>
          <Button variant="outline" onClick={exportMonthlyCsv}>Download Summary</Button>
          <Button variant="outline" onClick={exportTransactionCsv} disabled={monthlyTransactions(orders, selectedMonth).length === 0}>Download Transactions</Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReportMetric label="Gross Sales" value={selected.grossSales} />
        <ReportMetric label="Refunds" value={selected.refunds} />
        <ReportMetric label="Gross Profit" value={selected.grossProfit} />
        <ReportMetric label="Net Profit" value={selected.netProfit} />
      </div>

      <Table>
        <TableHeader><TableRow><TableHead>Month</TableHead><TableHead className="text-right">Gross Sales</TableHead><TableHead className="text-right">COGS</TableHead><TableHead className="text-right">Expenses</TableHead><TableHead className="text-right">Net Sales</TableHead><TableHead className="text-right">Net Profit</TableHead></TableRow></TableHeader>
        <TableBody>
          {monthly.slice().reverse().map((row) => (
            <TableRow key={row.month} className={row.month === selected.month ? 'bg-indigo-50' : undefined}>
              <TableCell>{new Date(`${row.month}-01`).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })}</TableCell>
              <TableCell className="text-right">GHS {row.grossSales.toFixed(2)}</TableCell>
              <TableCell className="text-right">GHS {row.cogs.toFixed(2)}</TableCell>
              <TableCell className="text-right">GHS {row.expenses.toFixed(2)}</TableCell>
              <TableCell className="text-right">GHS {row.netSales.toFixed(2)}</TableCell>
              <TableCell className="text-right font-semibold">GHS {row.netProfit.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900">Transactions for this month</p>
        <p className="mt-1 text-xs text-slate-500">
          Use Download Transactions to export every recorded transaction line for the selected month.
        </p>
        <p className="mt-2 text-sm text-slate-700">
          Transaction export is available once transaction records are loaded from the sales history.
        </p>
      </div>
    </div>
  )
}

function monthlyTransactions(orders: Array<{
  so_number: string
  customer_name: string | null
  created_at: string
  status: string
  sales_order_items: Array<{ sku: string; quantity_shipped: number; unit_price: number | null }>
}>, selectedMonth: string) {
  return orders
    .filter((order) => order.status === 'shipped' && order.created_at.slice(0, 7) === selectedMonth)
    .flatMap((order) => order.sales_order_items.map((item) => ({
      date: new Date(order.created_at).toLocaleString(),
      transaction: order.so_number,
      customer: order.customer_name ?? 'Walk-in Customer',
      sku: item.sku,
      quantity: item.quantity_shipped,
      unitPrice: item.unit_price ?? 0,
      total: item.quantity_shipped * (item.unit_price ?? 0),
      status: order.status,
    })))
    .filter((transaction) => transaction.quantity > 0) as Array<{
    date: string
    transaction: string
    customer: string
    sku: string
    quantity: number
    unitPrice: number
    total: number
    status: string
  }>
}

function ReportMetric({ label, value }: { label: string; value: number }) {
  return <div className="rounded-lg border border-slate-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-xl font-bold text-slate-900">GHS {value.toFixed(2)}</p></div>
}
