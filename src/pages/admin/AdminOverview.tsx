import { useMemo, useState } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  PieChart as PieIcon,
  ShieldCheck,
  Building2,
  Wallet,
} from 'lucide-react'
import { useMonthlyFinancials } from '../../hooks/useMonthlyFinancials'
import { useProfitLoss } from '../../hooks/useProfitLoss'
import { useBudget } from '../../hooks/useBudget'

const EXPENSE_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4']

export default function AdminOverview() {
  const { data: monthlyFinancials, isLoading: monthlyLoading } = useMonthlyFinancials()
  const { data: pl, isLoading: plLoading } = useProfitLoss()
  const { data: budget } = useBudget()

  const [chartView, setChartView] = useState<'sales_vs_cogs' | 'net_profit'>('sales_vs_cogs')

  const lastMonthData = monthlyFinancials && monthlyFinancials.length > 0
    ? monthlyFinancials[monthlyFinancials.length - 1]
    : null

  const chartData = useMemo(() => {
    if (!monthlyFinancials || monthlyFinancials.length === 0) return []
    return monthlyFinancials.slice(-12).map((m) => {
      const date = new Date(m.month + '-01')
      const label = date.toLocaleDateString(undefined, { month: 'short' })
      return {
        name: label,
        sales: m.grossSales,
        cogs: m.cogs,
        profit: m.grossProfit,
        net: m.netProfit,
      }
    })
  }, [monthlyFinancials])

  const expenseData = useMemo(() => {
    if (!pl || !pl.expensesByCategory || pl.expensesByCategory.length === 0) return []
    return pl.expensesByCategory.map((e) => ({
      name: e.category,
      value: e.total,
    }))
  }, [pl])

  const totalExpenseSum = useMemo(() => {
    return expenseData.reduce((sum, e) => sum + e.value, 0)
  }, [expenseData])

  if (plLoading || monthlyLoading) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-8">
        <p className="text-sm text-slate-500">Loading executive overview...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Top 4 Executive KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* 1. Gross Sales */}
        <div className="relative overflow-hidden rounded-2xl border border-emerald-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Monthly Gross Sales
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              GHS {lastMonthData ? lastMonthData.grossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
              <TrendingUp size={13} /> Active Invoicing
            </span>
            <span className="text-slate-600 font-medium">COGS: GHS {pl ? pl.cogs.toFixed(2) : '0.00'}</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-500 w-4/5" />
          </div>
        </div>

        {/* 2. Gross Profit & Margin */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Gross Profit
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              GHS {pl ? pl.grossProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-medium text-indigo-600">
              Margin: {pl ? pl.grossMargin.toFixed(1) : 0}%
            </span>
            <span className="text-slate-600 font-medium">Post-COGS</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-indigo-600 w-3/4" />
          </div>
        </div>

        {/* 3. Net Profit */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Net Profit
            </span>
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${
              pl && pl.netProfit >= 0 ? 'bg-blue-500/10 text-blue-600' : 'bg-rose-500/10 text-rose-600'
            }`}>
              {pl && pl.netProfit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-bold tracking-tight ${
              pl && pl.netProfit >= 0 ? 'text-blue-700' : 'text-rose-600'
            }`}>
              GHS {pl ? pl.netProfit.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={`inline-flex items-center gap-1 font-medium ${
              pl && pl.netProfit >= 0 ? 'text-blue-600' : 'text-rose-600'
            }`}>
              Net Margin: {pl ? pl.netMargin.toFixed(1) : 0}%
            </span>
            <span className="text-slate-600 font-medium">Exp: GHS {pl ? pl.totalExpenses.toFixed(0) : '0'}</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className={`h-full rounded-full ${
              pl && pl.netProfit >= 0
                ? 'bg-gradient-to-r from-blue-400 to-blue-600 w-2/3'
                : 'bg-gradient-to-r from-rose-400 to-rose-600 w-1/3'
            }`} />
          </div>
        </div>

        {/* 4. Budget Remaining */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/80 bg-white p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Purchasing Budget
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600">
              <Wallet size={18} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-bold tracking-tight text-slate-900">
              GHS {budget ? budget.remaining.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1 font-medium text-amber-600">
              Spent: GHS {budget ? budget.spentThisMonth.toFixed(0) : '0'}
            </span>
            <span className="text-slate-600 font-medium">Limit: GHS {budget ? budget.monthlyBudget.toFixed(0) : '0'}</span>
          </div>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500 w-1/2" />
          </div>
        </div>
      </div>

      {/* 12-Month Performance Area Chart + Expenses Split (70/30) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 cols: Interactive Financial Trends Chart */}
        <div className="lg:col-span-8 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">Financial Performance</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {chartView === 'sales_vs_cogs'
                  ? 'Monthly Gross Sales vs. Acquisition Costs (COGS)'
                  : 'Monthly Net Profit trajectory'}
              </p>
            </div>

            <div className="inline-flex rounded-xl bg-slate-100 p-1 text-xs font-medium text-slate-600 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setChartView('sales_vs_cogs')}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  chartView === 'sales_vs_cogs'
                    ? 'bg-white font-semibold text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Sales vs. COGS
              </button>
              <button
                type="button"
                onClick={() => setChartView('net_profit')}
                className={`rounded-lg px-3 py-1.5 transition-all ${
                  chartView === 'net_profit'
                    ? 'bg-white font-semibold text-slate-900 shadow-xs'
                    : 'hover:text-slate-900'
                }`}
              >
                Net Profit
              </button>
            </div>
          </div>

          <div className="h-[280px] w-full">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No financial history available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                {chartView === 'sales_vs_cogs' ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adminColorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="adminColorCogs" x1="0" y1="0" x2="0" y2="1">
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
                                <span className="font-bold">GHS {Number(data.sales).toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-xs">
                                <span className="text-amber-600 font-medium">COGS:</span>
                                <span className="font-bold">GHS {Number(data.cogs).toFixed(2)}</span>
                              </div>
                              <div className="flex items-center justify-between gap-4 text-xs pt-1 border-t border-slate-100">
                                <span className="text-indigo-600 font-medium">Profit:</span>
                                <span className="font-bold">GHS {Number(data.profit).toFixed(2)}</span>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="sales"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#adminColorSales)"
                    />
                    <Area
                      type="monotone"
                      dataKey="cogs"
                      stroke="#f59e0b"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#adminColorCogs)"
                    />
                  </AreaChart>
                ) : (
                  <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="adminColorNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
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
                              <p className="mt-1 text-sm font-bold text-blue-600">
                                Net Profit: GHS {Number(data.net).toFixed(2)}
                              </p>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="net"
                      stroke="#3b82f6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#adminColorNet)"
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right 4 cols: Expense Distribution Donut */}
        <div className="lg:col-span-4 rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h4 className="text-sm font-semibold text-slate-900">Expense Breakdown</h4>
              <PieIcon size={16} className="text-slate-400" />
            </div>
            <p className="text-xs text-slate-500 mb-3">Operating costs by category</p>

            {expenseData.length === 0 ? (
              <div className="flex h-44 items-center justify-center text-xs text-slate-500">
                No categorized expenses this month.
              </div>
            ) : (
              <>
                <div className="h-36 w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={expenseData}
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {expenseData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={EXPENSE_COLORS[index % EXPENSE_COLORS.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase text-slate-400 font-semibold">Total</span>
                    <span className="text-xs font-bold text-slate-900">
                      GHS {totalExpenseSum >= 1000 ? `${(totalExpenseSum / 1000).toFixed(1)}k` : totalExpenseSum.toFixed(0)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 space-y-1.5">
                  {expenseData.slice(0, 4).map((e, idx) => {
                    const percent = totalExpenseSum > 0 ? Math.round((e.value / totalExpenseSum) * 100) : 0
                    return (
                      <div key={e.name} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className="h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: EXPENSE_COLORS[idx % EXPENSE_COLORS.length] }}
                          />
                          <span className="truncate text-slate-600 capitalize">{e.name}</span>
                        </div>
                        <span className="font-semibold text-slate-900">{percent}%</span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Period: Current Month</span>
            <span className="font-medium text-indigo-600">GHS {totalExpenseSum.toFixed(2)} Total</span>
          </div>
        </div>
      </div>

      {/* Operational Highlights */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Building2 size={20} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Multi-Site Scale</p>
            <p className="text-sm font-semibold text-slate-900">Synchronized Across Locations</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Real-time Costing</p>
            <p className="text-sm font-semibold text-slate-900">FIFO Batch Valuations</p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-xs">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
            <ShieldCheck size={20} />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-medium">Governance</p>
            <p className="text-sm font-semibold text-slate-900">Immutable Audit Trail</p>
          </div>
        </div>
      </div>
    </div>
  )
}
