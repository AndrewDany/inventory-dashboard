import { useMonthlyFinancials } from '../../hooks/useMonthlyFinancials'
import { useProfitLoss } from '../../hooks/useProfitLoss'

export default function AdminOverview() {
  const { data: monthlyFinancials } = useMonthlyFinancials()
  const { data: pl, isLoading: plLoading } = useProfitLoss()

  const lastMonthData = monthlyFinancials && monthlyFinancials.length > 0
    ? monthlyFinancials[monthlyFinancials.length - 1]
    : null

  if (plLoading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8">
        <p className="text-sm text-slate-500">Loading financial overview...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600">Monthly Gross Sales</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            GHS {lastMonthData ? lastMonthData.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </p>
          {pl && (
            <p className="mt-1 text-xs text-emerald-600">Cost of goods sold: GHS {pl.cogs.toFixed(2)}</p>
          )}
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
          <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-600">Gross Profit</p>
          {pl ? (
            <>
              <p className="mt-2 text-2xl font-bold text-indigo-700">GHS {pl.grossProfit.toFixed(2)}</p>
              <p className="mt-1 text-xs text-indigo-600">Margin: {pl.grossMargin.toFixed(1)}%</p>
            </>
          ) : (
            <p className="mt-2 text-2xl font-bold text-indigo-700">GHS 0.00</p>
          )}
        </div>

        <div
          className={`rounded-2xl border p-5 ${
            pl && pl.netProfit >= 0 ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'
          }`}
        >
          <p className={`text-[10px] uppercase tracking-[0.2em] ${pl && pl.netProfit >= 0 ? 'text-blue-600' : 'text-slate-500'}`}>
            Net Profit
          </p>
          {pl ? (
            <>
              <p className={`mt-2 text-2xl font-bold ${pl.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                GHS {pl.netProfit.toFixed(2)}
              </p>
              <p className={`mt-1 text-xs ${pl.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                Expenses: GHS {pl.totalExpenses.toFixed(2)} · Margin: {pl.netMargin.toFixed(1)}%
              </p>
            </>
          ) : (
            <p className="mt-2 text-2xl font-bold text-slate-700">GHS 0.00</p>
          )}
        </div>
      </div>

      {/* Monthly financials */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-[10px] uppercase tracking-[0.25em] text-amber-700">Monthly Financials</p>
            <h4 className="mt-1 text-lg font-semibold text-slate-900">Gross Sales &amp; Acquisition Costs</h4>
            <p className="mt-2 text-sm text-slate-600">
              Revenue from sales orders vs. cost of goods sold for the current month.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200 bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600">Monthly Gross Sales</p>
            <p className="mt-2 text-2xl font-bold text-emerald-700">
              GHS {lastMonthData ? lastMonthData.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-white p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-amber-600">Monthly COGS</p>
            <p className="mt-2 text-2xl font-bold text-amber-700">
              GHS {lastMonthData ? lastMonthData.cogs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </p>
          </div>
        </div>

        {monthlyFinancials && monthlyFinancials.length > 0 && (
          <div className="mt-4 rounded-2xl border border-slate-100 bg-white p-4">
            <p className="text-sm font-semibold text-slate-900 mb-3">Last 12 months trend</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-2 pr-4 font-medium text-slate-500">Month</th>
                    <th className="text-right py-2 pr-4 font-medium text-emerald-600">Gross Sales</th>
                    <th className="text-right py-2 font-medium text-amber-600">COGS</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyFinancials.slice(-12).map((m) => (
                    <tr key={m.month} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 pr-4 text-slate-700">
                        {new Date(m.month + '-01').toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                      </td>
                      <td className="text-right py-2 pr-4 font-medium text-emerald-700">
                        GHS {m.grossSales.toFixed(2)}
                      </td>
                      <td className="text-right py-2 font-medium text-amber-700">
                        GHS {m.cogs.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(!monthlyFinancials || monthlyFinancials.length === 0) && (
          <div className="mt-4 rounded-xl bg-white p-4 text-center text-sm text-slate-500">
            {monthlyFinancials === undefined ? 'Loading monthly data...' : 'No sales or purchase data yet.'}
          </div>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Sites</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">Multi-location</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Reorder</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">Low-stock focus</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">Control</p>
          <p className="mt-2 text-xl font-semibold text-slate-900">Role-based</p>
        </div>
      </div>
    </div>
  )
}

