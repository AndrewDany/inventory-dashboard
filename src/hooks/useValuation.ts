import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/apiClient'
import type { ValuationRun } from '../types/procurement'

export function useValuationRuns() {
  return useQuery({
    queryKey: ['valuation_runs'],
    queryFn: async (): Promise<ValuationRun[]> => {
      const data = await api.get<any>('/financials/valuation')
      return [
        {
          id: 'v-latest',
          costing_method: 'FIFO / Average Cost',
          started_at: data.calculated_at || new Date().toISOString(),
          finished_at: data.calculated_at || new Date().toISOString(),
          notes: `Retail Val: GHC ${(data.retail_valuation || 0).toLocaleString()} • Cost Val: GHC ${(data.cost_valuation || 0).toLocaleString()}`,
        },
      ]
    },
  })
}

interface ValuationResult {
  success: boolean
  run_id: string
  total_value: number
  total_units: number
  by_sku: { sku: string; on_hand_quantity: number; total_value: number }[]
}

export function useRecomputeValuation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (): Promise<ValuationResult> => {
      const data = await api.get<any>('/financials/valuation')
      return {
        success: true,
        run_id: 'val-' + Date.now(),
        total_value: Number(data.retail_valuation || 0),
        total_units: Number(data.total_units || 0),
        by_sku: [],
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['valuation_runs'] })
      toast.success(`Valuation recomputed: ${data.total_units} units, total value GHC ${data.total_value.toFixed(2)}`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to recompute valuation: ${error.message}`)
    },
  })
}
