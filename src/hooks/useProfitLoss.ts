import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/apiClient'

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

export function useProfitLoss() {
  return useQuery({
    queryKey: ['profit_loss'],
    queryFn: async (): Promise<ProfitLossReport> => {
      const data = await api.get<any>('/financials/profit-loss')
      return {
        revenue: Number(data.grossSales ?? 0),
        refunds: Number(data.totalRefunds ?? 0),
        netRevenue: Number(data.netSales ?? 0),
        cogs: Number(data.cogs ?? 0),
        grossProfit: Number(data.grossProfit ?? 0),
        grossMargin: Number(data.grossMargin ?? 0),
        totalExpenses: Number(data.totalExpenses ?? 0),
        netProfit: Number(data.netProfit ?? 0),
        netMargin: Number(data.netMargin ?? 0),
        expensesByCategory: (data.expensesByCategory || []).map((e: any) => ({
          category: e.category,
          total: Number(e.total || 0),
        })),
      }
    },
  })
}