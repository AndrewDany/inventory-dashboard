import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/apiClient'

export interface MonthlyFinancial {
  month: string // YYYY-MM
  grossSales: number
  refunds: number
  netSales: number
  cogs: number
  grossProfit: number
  expenses: number
  netProfit: number
}

export function useMonthlyFinancials() {
  return useQuery({
    queryKey: ['monthly_financials'],
    queryFn: async (): Promise<MonthlyFinancial[]> => {
      const data = await api.get<any[]>('/financials/monthly')
      return (data || []).map((m) => ({
        month: m.month,
        grossSales: Number(m.grossSales || 0),
        refunds: Number(m.refunds || 0),
        netSales: Number(m.grossSales || 0) - Number(m.refunds || 0),
        cogs: Number(m.cogs || 0),
        grossProfit: Number(m.grossProfit || 0),
        expenses: Number(m.expenses || 0),
        netProfit: Number(m.netProfit || 0),
      }))
    },
  })
}