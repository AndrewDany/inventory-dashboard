import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export interface ProfitLossReport {
  revenue: number
  cogs: number
  grossProfit: number
  grossMargin: number
  totalExpenses: number
  netProfit: number
  netMargin: number
  expensesByCategory: { category: string; total: number }[]
}

function getMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  return { start, end }
}

export function useProfitLoss() {
  const { start, end } = getMonthRange()

  return useQuery({
    queryKey: ['profit_loss', start, end],
    queryFn: async (): Promise<ProfitLossReport> => {
      // Revenue: what was actually shipped this month, at sale price
      const { data: soItems, error: soError } = await supabase
        .from('sales_order_items')
        .select('quantity_shipped, unit_price, sales_orders!inner(created_at)')
        .gte('sales_orders.created_at', start)
        .lte('sales_orders.created_at', end + 'T23:59:59')

      if (soError) throw new Error(soError.message)

      const revenue = (soItems ?? []).reduce(
        (sum, item: any) => sum + item.quantity_shipped * (item.unit_price ?? 0),
        0
      )

      // COGS: actual cost of everything shipped out this month (negative stock_movements)
      const { data: movements, error: movError } = await supabase
        .from('stock_movements')
        .select('change_amount, unit_cost, created_at')
        .lt('change_amount', 0)
        .gte('created_at', start)
        .lte('created_at', end + 'T23:59:59')

      if (movError) throw new Error(movError.message)

      const cogs = (movements ?? []).reduce(
        (sum, m) => sum + Math.abs(m.change_amount) * (m.unit_cost ?? 0),
        0
      )

      const grossProfit = revenue - cogs
      const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0

      // Operating expenses this month
      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('amount, category')
        .gte('expense_date', start)
        .lte('expense_date', end)

      if (expError) throw new Error(expError.message)

      const totalExpenses = (expenses ?? []).reduce((sum, e) => sum + e.amount, 0)

      const byCategory = new Map<string, number>()
      for (const e of expenses ?? []) {
        byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + e.amount)
      }
      const expensesByCategory = Array.from(byCategory.entries())
        .map(([category, total]) => ({ category, total }))
        .sort((a, b) => b.total - a.total)

      const netProfit = grossProfit - totalExpenses
      const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0

      return {
        revenue,
        cogs,
        grossProfit,
        grossMargin,
        totalExpenses,
        netProfit,
        netMargin,
        expensesByCategory,
      }
    },
  })
}