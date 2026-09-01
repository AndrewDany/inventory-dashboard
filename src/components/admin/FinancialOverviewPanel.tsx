import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useProfitLoss } from '../../hooks/useProfitLoss'
import { useMonthlyFinancials } from '../../hooks/useMonthlyFinancials'
import { useBudget, useUpdateBudget } from '../../hooks/useBudget'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import ExpensesTable from './ExpensesTable'

export default function FinancialOverviewPanel() {
  const { data: pl, isLoading: plLoading, error: plError } = useProfitLoss()
  const { data: monthly } = useMonthlyFinancials()
  const { data: budget, isLoading: budgetLoading, error: budgetError } = useBudget()
  const updateBudget = useUpdateBudget()

  const [budgetDraft, setBudgetDraft] = useState<string>('')

  if (plLoading || budgetLoading) return <p className="text-gray-500 text-sm">Loading financial overview...</p>
  if (plError) return <p className="text-red-600 text-sm">Error: {plError.message}</p>
  if (budgetError) return <p className="text-red-600 text-sm">Error: {budgetError.message}</p>
  if (!pl || !budget) return null

  return (
    <div className="space-y-6">
      {/* Top metrics — all four working together */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-600">Monthly Revenue</p>
          <p className="mt-2 text-2xl font-bold text-emerald-700">GHS {pl.netRevenue.toFixed(2)}</p>
          <p className="mt-1 text-xs text-emerald-600">
            Gross sales: GHS {pl.revenue.toFixed(2)} &middot; Refunds: GHS {pl.refunds.toFixed(2)} &middot; COGS: GHS {pl.cogs.toFixed(2)}
          </p>
        </div>

        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-indigo-600">Gross Profit</p>
          <p className="mt-2 text-2xl font-bold text-indigo-700">GHS {pl.grossProfit.toFixed(2)}</p>
          <p className="mt-1 text-xs text-indigo-600">Margin: {pl.grossMargin.toFixed(1)}%</p>
        </div>

        <div
          className={`rounded-2xl border p-4 ${
            pl.netProfit >= 0 ? 'border-blue-200 bg-blue-50' : 'border-red-200 bg-red-50'
          }`}
        >
          <p className={`text-[10px] uppercase tracking-[0.2em] ${pl.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            Net Profit
          </p>
          <p className={`mt-2 text-2xl font-bold ${pl.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
            GHS {pl.netProfit.toFixed(2)}
          </p>
          <p className={`mt-1 text-xs ${pl.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
            Expenses: GHS {pl.totalExpenses.toFixed(2)} · Margin: {pl.netMargin.toFixed(1)}%
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-amber-600">Budget Remaining</p>
          <p className="mt-2 text-2xl font-bold text-amber-700">GHS {budget.remaining.toFixed(2)}</p>
          <p className="mt-1 text-xs text-amber-600">
            Spent restocking: GHS {budget.spentThisMonth.toFixed(2)} of GHS {budget.monthlyBudget.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Budget control */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900 mb-3">Set Monthly Purchasing Budget</p>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <Label htmlFor="budget" className="mb-1 block">Budget (GHS)</Label>
            <Input
              id="budget"
              type="number"
              min="0"
              step="0.01"
              placeholder={budget.monthlyBudget.toString()}
              value={budgetDraft}
              onChange={(e) => setBudgetDraft(e.target.value)}
            />
          </div>
          <Button
            disabled={!budgetDraft || updateBudget.isPending}
            onClick={() => {
              updateBudget.mutate(Number(budgetDraft))
              setBudgetDraft('')
            }}
          >
            <Plus size={14} className="mr-1" /> Update Budget
          </Button>
        </div>
      </div>

      {/* Expenses */}
      <div className="rounded-2xl border border-slate-100 bg-white p-4">
        <p className="text-sm font-semibold text-slate-900 mb-3">Expenses</p>
        <ExpensesTable />
      </div>

      {/* 12-month trend */}
      {monthly && monthly.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-white p-4">
          <p className="text-sm font-semibold text-slate-900 mb-3">Recent trend</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left py-2 pr-4 font-medium text-slate-500">Month</th>
                  <th className="text-right py-2 pr-4 font-medium text-emerald-600">Gross Sales</th>
                  <th className="text-right py-2 pr-4 font-medium text-rose-500">Refunds</th>
                  <th className="text-right py-2 pr-4 font-medium text-indigo-600">Gross Profit</th>
                  <th className="text-right py-2 font-medium text-blue-600">Net Profit</th>
                </tr>
              </thead>
              <tbody>
                {monthly.slice(-12).map((m) => (
                  <tr key={m.month} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 pr-4 text-slate-700">
                      {new Date(m.month + '-01').toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                    </td>
                    <td className="text-right py-2 pr-4 font-medium text-emerald-700">GHS {m.grossSales.toFixed(2)}</td>
                    <td className="text-right py-2 pr-4 font-medium text-rose-500">GHS {m.refunds.toFixed(2)}</td>
                    <td className="text-right py-2 pr-4 font-medium text-indigo-700">GHS {m.grossProfit.toFixed(2)}</td>
                    <td className={`text-right py-2 font-medium ${m.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
                      GHS {m.netProfit.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}