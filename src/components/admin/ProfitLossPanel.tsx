import { useProfitLoss } from '../../hooks/useProfitLoss'
import { EXPENSE_CATEGORIES } from '../../types/expense'

export default function ProfitLossPanel() {
  const { data, isLoading, error } = useProfitLoss()

  if (isLoading) return <p className="text-gray-500 text-sm">Loading profit & loss...</p>
  if (error) return <p className="text-red-600 text-sm">Error: {error.message}</p>
  if (!data) return null

  const categoryLabel = (value: string) =>
    EXPENSE_CATEGORIES.find((c) => c.value === value)?.label ?? value

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600">Revenue</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">GHS {data.revenue.toFixed(2)}</p>
          <p className="mt-1 text-xs text-emerald-600">COGS: GHS {data.cogs.toFixed(2)}</p>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-600">Gross Profit</p>
          <p className="mt-2 text-2xl font-bold text-indigo-700">GHS {data.grossProfit.toFixed(2)}</p>
          <p className="mt-1 text-xs text-indigo-600">Margin: {data.grossMargin.toFixed(1)}%</p>
        </div>

        <div
          className={`rounded-2xl border p-4 ${
            data.netProfit >= 0 ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'
          }`}
        >
          <p
            className={`text-[10px] uppercase tracking-[0.2em] ${
              data.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
            }`}
          >
            Net Profit
          </p>
          <p className={`mt-2 text-2xl font-bold ${data.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            GHS {data.netProfit.toFixed(2)}
          </p>
          <p className={`mt-1 text-xs ${data.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            Margin: {data.netMargin.toFixed(1)}% · Expenses: GHS {data.totalExpenses.toFixed(2)}
          </p>
        </div>
      </div>

      {data.expensesByCategory.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900 mb-3">Expenses by category (this month)</p>
          <div className="space-y-2">
            {data.expensesByCategory.map((c) => (
              <div key={c.category} className="flex justify-between text-sm">
                <span className="text-slate-600">{categoryLabel(c.category)}</span>
                <span className="font-medium text-slate-900">GHS {c.total.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}