import { useMemo } from 'react'
import { DollarSign, Package, AlertTriangle, Layers, TrendingUp } from 'lucide-react'
import type { InventoryItem } from '../../types/inventory'

interface StatsCardsProps {
  items: InventoryItem[]
  monthlyRevenue?: number
}

export default function StatsCards({ items, monthlyRevenue }: StatsCardsProps) {
  const stats = useMemo(() => {
    const totalItems = items.length
    const totalUnits = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0)

    const totalValue = items.reduce((sum, item) => {
      const price = item.unit_price ?? 0
      return sum + (item.quantity ?? 0) * price
    }, 0)

    const lowStockItems = items.filter((item) => item.quantity <= item.reorder_level && item.quantity > 0)
    const outOfStockItems = items.filter((item) => item.quantity <= 0)
    const criticalCount = lowStockItems.length + outOfStockItems.length

    const categoriesCount = new Set(items.map((i) => i.category || 'Uncategorized')).size

    return {
      totalItems,
      totalUnits,
      totalValue,
      criticalCount,
      outOfStockCount: outOfStockItems.length,
      categoriesCount,
    }
  }, [items])

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Total Inventory Valuation */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Valuation
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
            <DollarSign size={18} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            GHS {stats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
            <TrendingUp size={13} /> Active Assets
          </span>
          <span className="text-slate-600 font-medium">{stats.totalUnits.toLocaleString()} units total</span>
        </div>

        {/* Mini Sparkline Graphic */}
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 w-3/4" />
        </div>
      </div>

      {/* 2. Total SKUs & Stock Units */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Products / SKUs
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
            <Package size={18} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {stats.totalItems.toLocaleString()}
          </span>
          <span className="text-xs font-medium text-slate-600">SKUs</span>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
            <TrendingUp size={13} /> {stats.categoriesCount} categories
          </span>
          <span className="text-slate-600 font-medium">{stats.totalUnits.toLocaleString()} on hand</span>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 w-4/5" />
        </div>
      </div>

      {/* 3. Low Stock & Critical Items */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Stock Attention
          </span>
          <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
            stats.criticalCount > 0 ? 'bg-rose-500/10 text-rose-600' : 'bg-slate-100 text-slate-500'
          }`}>
            <AlertTriangle size={18} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className={`text-2xl font-bold tracking-tight ${
            stats.criticalCount > 0 ? 'text-rose-600' : 'text-slate-900'
          }`}>
            {stats.criticalCount}
          </span>
          <span className="text-xs font-medium text-slate-600">items need reorder</span>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className={`inline-flex items-center gap-1 font-medium ${
            stats.outOfStockCount > 0 ? 'text-rose-600 font-semibold' : 'text-slate-600'
          }`}>
            {stats.outOfStockCount > 0 ? `${stats.outOfStockCount} Out of stock` : '0 Out of stock'}
          </span>
          <span className="text-slate-600 font-medium">Reorder triggers</span>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className={`h-full rounded-full ${
            stats.criticalCount > 0
              ? 'bg-gradient-to-r from-rose-400 to-rose-500 w-1/2'
              : 'bg-gradient-to-r from-emerald-400 to-emerald-500 w-full'
          }`} />
        </div>
      </div>

      {/* 4. Active Turnover / Revenue */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Monthly Turnover
          </span>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
            <Layers size={18} />
          </div>
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            {monthlyRevenue !== undefined
              ? `GHS ${monthlyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : `${stats.categoriesCount} Catalog Depts`}
          </span>
        </div>

        <div className="mt-2 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-1 font-medium text-indigo-600">
            <TrendingUp size={13} /> Active Velocity
          </span>
          <span className="text-slate-600 font-medium">Live sync</span>
        </div>

        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 w-2/3" />
        </div>
      </div>
    </div>
  )
}