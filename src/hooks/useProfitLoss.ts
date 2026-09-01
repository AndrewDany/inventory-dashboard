import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import { useMonthlyFinancials } from './useMonthlyFinancials'

export interface ProfitLossReport {
  revenue: number
  refunds: number
  netRevenue: number
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

      // Reuse useMonthlyFinancials' numbers directly rather than recomputing them here,
      // so the two hooks can never drift out of sync (e.g. one accounting for refunds
      // and the other not).
      const currentMonthRow = monthlyFinancials.find((m) => m.month === currentMonthKey)
      const revenue = currentMonthRow?.grossSales ?? 0
      const refunds = currentMonthRow?.refunds ?? 0
      const netRevenue = currentMonthRow?.netSales ?? revenue - refunds
      const cogs = currentMonthRow?.cogs ?? 0
      const grossProfit = currentMonthRow?.grossProfit ?? netRevenue - cogs
      const grossMargin = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0

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
      const netMargin = netRevenue > 0 ? (netProfit / netRevenue) * 100 : 0

      return {
        revenue,
        refunds,
        netRevenue,
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