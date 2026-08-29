import { useBudget } from '../../hooks/useBudget'
import { useUsage } from '../../hooks/useUsage'
import type { InventoryItem } from '../../types/inventory'

export default function UsagePanel({ items = [] }: { items?: InventoryItem[] }) {
  const { data: usage } = useUsage()
  const { data: budgetSummary } = useBudget()

  const budget = budgetSummary?.monthlyBudget ?? 0
  const spent = budgetSummary?.spentThisMonth ?? 0
  const budgetPercent = budget > 0 ? Math.min(Math.round((spent / budget) * 100), 100) : 0

  const totalItems = items.length
  const healthyStockCount = items.filter((i) => (i.quantity ?? 0) > (i.reorder_level ?? 0)).length
  const stockHealthPercent = totalItems > 0 ? Math.round((healthyStockCount / totalItems) * 100) : 100

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-semibold text-slate-900">Monthly Targets &amp; Health</h4>
          <span className="text-[11px] font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            Active
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-4">Track progress toward inventory goals &amp; capacity</p>

        <div className="space-y-4">
          {/* Target 1: Monthly Restock Budget */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-700">Restock Budget Utilization</span>
              <span className="font-bold text-slate-900">{budgetPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  budgetPercent > 90
                    ? 'bg-rose-500'
                    : budgetPercent > 70
                    ? 'bg-amber-500'
                    : 'bg-indigo-600'
                }`}
                style={{ width: `${budgetPercent}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>GHS {spent.toLocaleString()} spent</span>
              <span>Target: GHS {budget.toLocaleString()}</span>
            </div>
          </div>

          {/* Target 2: Stock Health Fulfillment */}
          <div>
            <div className="flex items-center justify-between text-xs mb-1.5">
              <span className="font-medium text-slate-700">Stock Reorder Health</span>
              <span className="font-bold text-emerald-600">{stockHealthPercent}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                style={{ width: `${stockHealthPercent}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
              <span>{healthyStockCount} items optimal</span>
              <span>{totalItems - healthyStockCount} need restock</span>
            </div>
          </div>

          {/* System Storage Capacity */}
          {usage && (
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="font-medium text-slate-700">Multi-Site Scale</span>
                <span className="font-bold text-slate-900">{usage.locationCount} Active Sites</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-purple-500 transition-all duration-500"
                  style={{ width: `${Math.min(usage.locationCount * 25, 100)}%` }}
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                <span>{usage.userCount} Team Members</span>
                <span>{usage.itemCount} SKUs managed</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

