// src/hooks/useInventoryAdjustments.ts
// ------------------------------------------------------------
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { supabase } from '../lib/supabaseClient'
import type { InventoryAdjustment } from '../types/procurement'

export function useInventoryAdjustments() {
  return useQuery({
    queryKey: ['inventory_adjustments'],
    queryFn: async (): Promise<InventoryAdjustment[]> => {
      const { data, error } = await supabase
        .from('inventory_adjustments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw new Error(error.message)
      return data as InventoryAdjustment[]
    },
  })
}

interface ApplyAdjustmentInput {
  inventory_item_id: number | null
  sku: string
  location_id: string
  quantity_delta: number
  reason: 'manual_add' | 'manual_remove' | 'cycle_count' | 'write_off' | 'other'
  notes?: string
  batch_id?: string
}

export function useApplyInventoryAdjustment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: ApplyAdjustmentInput) => {
      const { data, error } = await supabase.rpc('apply_inventory_adjustment', {
        p_inventory_item_id: input.inventory_item_id,
        p_sku: input.sku,
        p_location_id: input.location_id,
        p_quantity_delta: input.quantity_delta,
        p_reason: input.reason,
        p_notes: input.notes ?? null,
        p_batch_id: input.batch_id ?? null,
      })

      if (error) throw new Error(error.message)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory_adjustments'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_items'] })
      queryClient.invalidateQueries({ queryKey: ['stock_movements'] })
      queryClient.invalidateQueries({ queryKey: ['inventory_batches'] })
      toast.success('Adjustment applied')
    },
    onError: (error: Error) => {
      toast.error(`Failed to apply adjustment: ${error.message}`)
    },
  })
}
