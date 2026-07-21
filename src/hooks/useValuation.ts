// src/hooks/useValuation.ts
// ------------------------------------------------------------
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import type { ValuationRun } from '../types/procurement'

export function useValuationRuns() {
  return useQuery({
    queryKey: ['valuation_runs'],
    queryFn: async (): Promise<ValuationRun[]> => {
      const { data, error } = await supabase
        .from('valuation_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20)

      if (error) throw new Error(error.message)
      return data as ValuationRun[]
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
    mutationFn: async (notes?: string): Promise<ValuationResult> => {
      const { data, error } = await supabase.rpc('recompute_valuation', {
        p_notes: notes ?? null,
      })

      if (error) throw new Error(error.message)
      return data as ValuationResult
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['valuation_runs'] })
      toast.success(`Valuation recomputed: ${data.total_units} units, total value ${data.total_value.toFixed(2)}`)
    },
    onError: (error: Error) => {
      toast.error(`Failed to recompute valuation: ${error.message}`)
    },
  })
}
