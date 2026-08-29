import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts'
import type { InventoryItem } from '../../types/inventory'

const DONUT_COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#64748b']

export default function CategoryDonut({ items = [] }: { items?: InventoryItem[] }) {
  const { data, totalUnits } = useMemo(() => {
    const map: Record<string, number> = {}
    let total = 0

    items.forEach((item) => {
      const cat = item.category || 'Uncategorized'
      const qty = item.quantity ?? 0
      map[cat] = (map[cat] || 0) + qty
      total += qty
    })

    const sorted = Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Take top 4, group remainder into "Other"
    const top4 = sorted.slice(0, 4)
    const rest = sorted.slice(4)
    if (rest.length > 0) {
      const restSum = rest.reduce((acc, curr) => acc + curr.value, 0)
      top4.push({ name: 'Other', value: restSum })
    }

    return { data: top4, totalUnits: total }
  }, [items])

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-semibold text-slate-900">Stock Distribution</h4>
          <span className="text-[11px] font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
            By Category
          </span>
        </div>
        <p className="text-xs text-slate-500 mb-3">On-hand quantity breakdown across lines</p>

        {data.length === 0 ? (
          <div className="flex h-36 items-center justify-center text-xs text-slate-500">
            No stock data available.
          </div>
        ) : (
          <>
            <div className="h-36 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    innerRadius={46}
                    outerRadius={66}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {data.map((_, index) => (
                      <Cell key={`donut-cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase text-slate-400 font-semibold">Total Units</span>
                <span className="text-sm font-bold text-slate-900">
                  {totalUnits >= 1000 ? `${(totalUnits / 1000).toFixed(1)}k` : totalUnits}
                </span>
              </div>
            </div>

            <div className="mt-3 space-y-1.5">
              {data.map((cat, idx) => {
                const percent = totalUnits > 0 ? Math.round((cat.value / totalUnits) * 100) : 0
                return (
                  <div key={cat.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }}
                      />
                      <span className="truncate text-slate-600 capitalize">{cat.name}</span>
                    </div>
                    <span className="font-semibold text-slate-900">{percent}%</span>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

