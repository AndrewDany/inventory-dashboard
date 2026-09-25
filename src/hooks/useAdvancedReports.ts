import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/apiClient'

export interface ValuationTrend {
  month: string
  totalValue: number
  totalUnits: number
}

export interface TopMover {
  sku: string
  name: string
  totalSold: number
  totalRevenue: number
  category: string | null
}

export interface SupplierPerformance {
  supplierName: string
  totalPOs: number
  completedPOs: number
  onTimeRate: number
  totalSpent: number
}

export function useValuationTrends() {
  return useQuery({
    queryKey: ['valuation_trends'],
    queryFn: async (): Promise<ValuationTrend[]> => {
      const data = await api.get<ValuationTrend[]>('/reports/valuation-trends')
      return data || []
    },
    staleTime: 60_000,
  })
}

export function useTopMovers() {
  return useQuery({
    queryKey: ['top_movers'],
    queryFn: async (): Promise<TopMover[]> => {
      const data = await api.get<TopMover[]>('/reports/top-movers')
      return data || []
    },
    staleTime: 60_000,
  })
}

export function useSupplierPerformance() {
  return useQuery({
    queryKey: ['supplier_performance'],
    queryFn: async (): Promise<SupplierPerformance[]> => {
      const data = await api.get<SupplierPerformance[]>('/reports/supplier-performance')
      return data || []
    },
    staleTime: 60_000,
  })
}
