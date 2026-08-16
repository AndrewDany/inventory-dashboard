import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useMonthlyFinancials } from './useMonthlyFinancials'

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
  const { data: monthlyFinancials, isLoading: monthlyLoading, error: monthlyError } = useMonthlyFinancials()
  const { start, end } = getMonthRange()

  const currentMonthKey = new Date().toISOString().slice(0, 7)

  return useQuery({
    queryKey: ['profit_loss', start, end],
    queryFn: async (): Promise<ProfitLossReport> => {
      if (!monthlyFinancials) throw new Error('Monthly financials unavailable')

      const currentMonthRow = monthlyFinancials.find((m) => m.month === currentMonthKey)
      const revenue = currentMonthRow?.grossSales ?? 0
      const cogs = currentMonthRow?.cogs ?? 0

      const grossProfit = revenue - cogs
      const grossMargin = revenue > 0 ? (grossProfit / revenue) * 100 : 0

      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, category')
        .gte('expense_date', start)
        .lte('expense_date', end)

      if (expensesError) throw new Error(expensesError.message)

      const rows = (expenses ?? []) as Array<{ amount: number; category: string }>
      const totalExpenses = rows.reduce((sum, e) => sum + Number(e.amount ?? 0), 0)

      const byCategory = new Map<string, number>()
      for (const e of rows) {
        byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + Number(e.amount ?? 0))
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
    enabled: !monthlyLoading && !monthlyError && !!monthlyFinancials,
  })
}

