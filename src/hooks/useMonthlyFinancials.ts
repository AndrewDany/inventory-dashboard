import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export interface MonthlyFinancial {
  month: string // YYYY-MM
  grossSales: number
  cogs: number
  grossProfit: number
  expenses: number
  netProfit: number
}

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7)
}

export function useMonthlyFinancials() {
  return useQuery({
    queryKey: ['monthly_financials'],
    queryFn: async (): Promise<MonthlyFinancial[]> => {
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11)
      twelveMonthsAgo.setDate(1)
      const since = twelveMonthsAgo.toISOString().slice(0, 10)

      // Revenue: shipped sales order items
      const { data: soItems, error: soError } = await supabase
        .from('sales_order_items')
        .select('quantity_shipped, unit_price, sales_orders!inner(created_at)')
        .gte('sales_orders.created_at', since)

      if (soError) throw new Error(soError.message)

      // COGS: negative stock movements (goods going out), with their cost at time of movement
      const { data: movements, error: movError } = await supabase
        .from('stock_movements')
        .select('change_amount, unit_cost, created_at')
        .lt('change_amount', 0)
        .gte('created_at', since)

      if (movError) throw new Error(movError.message)

      // Operating expenses
      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .gte('expense_date', since)

      if (expError) throw new Error(expError.message)

      const months = new Map<string, MonthlyFinancial>()

      const ensure = (key: string) => {
        if (!months.has(key)) {
          months.set(key, { month: key, grossSales: 0, cogs: 0, grossProfit: 0, expenses: 0, netProfit: 0 })
        }
        return months.get(key)!
      }

      for (const item of (soItems ?? []) as any[]) {
        const key = monthKey(item.sales_orders.created_at)
        ensure(key).grossSales += item.quantity_shipped * (item.unit_price ?? 0)
      }

      for (const m of movements ?? []) {
        const key = monthKey(m.created_at)
        ensure(key).cogs += Math.abs(m.change_amount) * (m.unit_cost ?? 0)
      }

      for (const e of expenses ?? []) {
        const key = monthKey(e.expense_date)
        ensure(key).expenses += e.amount
      }

      const result = Array.from(months.values())
        .map((m) => ({
          ...m,
          grossProfit: m.grossSales - m.cogs,
          netProfit: m.grossSales - m.cogs - m.expenses,
        }))
        .sort((a, b) => a.month.localeCompare(b.month))

      return result
    },
  })
}