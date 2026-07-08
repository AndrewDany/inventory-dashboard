import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import type { InventoryItem } from '../../types/inventory'

export default function CategoryChart({ items }: { items: InventoryItem[] }) {
  const chartData = useMemo(() => {
    const totals: Record<string, number> = {}

    items.forEach((item) => {
      const category = item.category || 'Uncategorized'
      totals[category] = (totals[category] || 0) + item.quantity
    })

    return Object.entries(totals).map(([category, quantity]) => ({
      category,
      quantity,
    }))
  }, [items])

  if (chartData.length === 0) return null

  return (
    <div className="bg-white rounded-lg shadow p-5 mb-6">
      <p className="text-sm text-gray-500 mb-4">Stock Quantity by Category</p>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="quantity" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}