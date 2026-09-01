import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

// Muted, low-saturation palette so the donut doesn't compete with the P&L stat
// card colors above it. "Other" (the smallest slices, bucketed) is always gray.
const SLICE_COLORS = ['#6366f1', '#a5b4fc', '#94a3b8', '#cbd5e1']
const OTHER_COLOR = '#e2e8f0'
const MAX_SLICES = 4

interface ExpenseCategoryDonutProps {
  data: { category: string; total: number }[]
  categoryLabel: (value: string) => string
}

export default function ExpenseCategoryDonut({ data, categoryLabel }: ExpenseCategoryDonutProps) {
  const sorted = [...data].sort((a, b) => b.total - a.total)
  const top = sorted.slice(0, MAX_SLICES)
  const rest = sorted.slice(MAX_SLICES)
  const otherTotal = rest.reduce((sum, c) => sum + c.total, 0)

  const slices = [
    ...top.map((c, i) => ({ name: categoryLabel(c.category), value: c.total, color: SLICE_COLORS[i % SLICE_COLORS.length] })),
    ...(otherTotal > 0 ? [{ name: 'Other', value: otherTotal, color: OTHER_COLOR }] : []),
  ]

  const total = slices.reduce((sum, s) => sum + s.value, 0)

  return (
    <div className="flex items-center gap-4">
      <div className="h-28 w-28 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="65%"
              outerRadius="100%"
              paddingAngle={1}
              stroke="none"
              isAnimationActive={false}
            >
              {slices.map((s, i) => (
                <Cell key={i} fill={s.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                const num = typeof value === 'number' ? value : Number(value ?? 0)
                return [`GHS ${num.toFixed(2)}`, String(name)]
              }}
              contentStyle={{ fontSize: 12, borderRadius: 6 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 space-y-1.5">
        {slices.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
              {s.name}
            </span>
            <span className="font-medium text-slate-900">
              GHS {s.value.toFixed(2)}
              <span className="ml-1 text-xs font-normal text-slate-400">
                ({total > 0 ? ((s.value / total) * 100).toFixed(0) : 0}%)
              </span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}