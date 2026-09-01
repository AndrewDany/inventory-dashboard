import type { ReactNode } from 'react'
import { ArrowDownRight, ArrowUpRight } from 'lucide-react'
import { AreaChart, Area, ResponsiveContainer } from 'recharts'

type ColorScheme = 'emerald' | 'indigo' | 'blue' | 'red' | 'amber'

const COLOR_MAP: Record<
  ColorScheme,
  { border: string; bg: string; label: string; value: string; subtitle: string; stroke: string; fill: string }
> = {
  emerald: {
    border: 'border-emerald-200',
    bg: 'bg-emerald-50',
    label: 'text-emerald-600',
    value: 'text-emerald-700',
    subtitle: 'text-emerald-600',
    stroke: '#10b981',
    fill: '#10b98122',
  },
  indigo: {
    border: 'border-indigo-200',
    bg: 'bg-indigo-50',
    label: 'text-indigo-600',
    value: 'text-indigo-700',
    subtitle: 'text-indigo-600',
    stroke: '#6366f1',
    fill: '#6366f122',
  },
  blue: {
    border: 'border-blue-200',
    bg: 'bg-blue-50',
    label: 'text-blue-600',
    value: 'text-blue-700',
    subtitle: 'text-blue-600',
    stroke: '#2563eb',
    fill: '#2563eb22',
  },
  red: {
    border: 'border-red-200',
    bg: 'bg-red-50',
    label: 'text-red-600',
    value: 'text-red-700',
    subtitle: 'text-red-600',
    stroke: '#dc2626',
    fill: '#dc262622',
  },
  amber: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    label: 'text-amber-600',
    value: 'text-amber-700',
    subtitle: 'text-amber-600',
    stroke: '#d97706',
    fill: '#d9770622',
  },
}

interface FinancialStatCardProps {
  label: string
  value: string
  subtitle: ReactNode
  colorScheme: ColorScheme
  sparklineData?: number[]
  deltaPct?: number | null
}

export default function FinancialStatCard({
  label,
  value,
  subtitle,
  colorScheme,
  sparklineData,
  deltaPct,
}: FinancialStatCardProps) {
  const c = COLOR_MAP[colorScheme]
  const hasSparkline = sparklineData && sparklineData.length >= 2
  const hasDelta = deltaPct !== null && deltaPct !== undefined && Number.isFinite(deltaPct)
  const isUp = hasDelta && (deltaPct as number) >= 0

  return (
    <div className={`rounded-lg border ${c.border} ${c.bg} p-4`}>
      <div className="flex items-start justify-between gap-2">
        <p className={`text-[10px] uppercase tracking-[0.2em] ${c.label}`}>{label}</p>
        {hasDelta && (
          <span
            className={`flex items-center gap-0.5 text-[11px] font-medium ${
              isUp ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(deltaPct as number).toFixed(1)}%
          </span>
        )}
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <p className={`text-2xl font-bold ${c.value}`}>{value}</p>
        {hasSparkline && (
          <div className="h-8 w-20 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparklineData!.map((v, i) => ({ i, v }))} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <Area
                  type="monotone"
                  dataKey="v"
                  stroke={c.stroke}
                  fill={c.fill}
                  strokeWidth={1.5}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <p className={`mt-1 text-xs ${c.subtitle}`}>{subtitle}</p>
    </div>
  )
}