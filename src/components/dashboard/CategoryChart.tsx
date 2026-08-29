import { useState, useMemo } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { InventoryItem } from '../../types/inventory'
import type { MonthlyFinancial } from '../../hooks/useMonthlyFinancials'

interface OverviewChartProps {
  items: InventoryItem[]
  monthlyFinancials?: MonthlyFinancial[]
}

type TabType = 'stock_value' | 'revenue' | 'volume'

export default function CategoryChart({ items, monthlyFinancials }: OverviewChartProps) {
  const [activeTab, setActiveTab] = useState<TabType>('stock_value')

  // 1. Stock Value by Category
  const categoryData = useMemo(() => {
    const map: Record<string, { value: number; units: number }> = {}

    items.forEach((item) => {
      const cat = item.category || 'Uncategorized'
      const val = (item.quantity ?? 0) * (item.unit_price ?? 0)
      if (!map[cat]) {
        map[cat] = { value: 0, units: 0 }
      }
      map[cat].value += val
      map[cat].units += item.quantity ?? 0
    })

    return Object.entries(map)
      .map(([name, data]) => ({
        name,
        value: Number(data.value.toFixed(2)),
        units: data.units,
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8)
  }, [items])

  // 2. Monthly Revenue & COGS Trend
  const monthlyData = useMemo(() => {
    if (!monthlyFinancials || monthlyFinancials.length === 0) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug']
      return months.map((m) => ({
        name: m,
        revenue: 0,
        cogs: 0,
        profit: 0,
      }))
    }

    return monthlyFinancials.slice(-8).map((m) => {
      const date = new Date(m.month + '-01')
      const label = date.toLocaleDateString(undefined, { month: 'short' })
      return {
        name: label,
        revenue: m.grossSales,
        cogs: m.cogs,
        profit: m.grossProfit,
      }
    })
  }, [monthlyFinancials])

  return (
    <div className="h-full rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Overview Analysis</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {activeTab === 'stock_value' && 'Stock valuation performance across top categories'}
              {activeTab === 'revenue' && 'Monthly sales revenue vs. acquisition costs (COGS)'}
              {activeTab === 'volume' && 'Stock unit quantity distribution'}
            </p>
          </div>

          {/* Tab Controls */}
          <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-medium text-slate-600 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('stock_value')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeTab === 'stock_value'
                  ? 'bg-white font-semibold text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Valuation
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('revenue')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeTab === 'revenue'
                  ? 'bg-white font-semibold text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Revenue
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('volume')}
              className={`rounded-lg px-3 py-1.5 transition-all ${
                activeTab === 'volume'
                  ? 'bg-white font-semibold text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              Units
            </button>
          </div>
        </div>

        {/* Area Chart Container - expanded to fill height smoothly */}
        <div className="h-[380px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'stock_value' ? (
              <AreaChart data={categoryData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorValuation" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-md">
                          <p className="text-xs font-semibold text-slate-900">{label}</p>
                          <p className="mt-1 text-sm font-bold text-indigo-600">
                            GHS {Number(data.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-[11px] text-slate-500">{data.units} units on hand</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorValuation)"
                />
              </AreaChart>
            ) : activeTab === 'revenue' ? (
              <AreaChart data={monthlyData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorCogs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v)}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-md space-y-1">
                          <p className="text-xs font-semibold text-slate-900">{label}</p>
                          <div className="flex items-center justify-between gap-4 text-xs">
                            <span className="text-emerald-600 font-medium">Sales:</span>
                            <span className="font-bold">GHS {Number(data.revenue).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between gap-4 text-xs">
                            <span className="text-amber-600 font-medium">COGS:</span>
                            <span className="font-bold">GHS {Number(data.cogs).toFixed(2)}</span>
                          </div>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Sales"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRev)"
                />
                <Area
                  type="monotone"
                  dataKey="cogs"
                  name="COGS"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCogs)"
                />
              </AreaChart>
            ) : (
              <AreaChart data={categoryData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload
                      return (
                        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-md">
                          <p className="text-xs font-semibold text-slate-900">{label}</p>
                          <p className="mt-1 text-sm font-bold text-cyan-600">{data.units} Units</p>
                        </div>
                      )
                    }
                    return null
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="units"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorUnits)"
                />
              </AreaChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <span>Real-time aggregation</span>
        <span className="font-medium text-indigo-600">{categoryData.length} Active Categories</span>
      </div>
    </div>
  )
}