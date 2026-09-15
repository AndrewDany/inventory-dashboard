import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { api } from '../lib/apiClient'
import type { InventoryAdjustment } from '../types/procurement'

export function useInventoryAdjustments() {
  return useQuery({
    queryKey: ['inventory_adjustments'],
    queryFn: async (): Promise<InventoryAdjustment[]> => {
      const data = await api.get<InventoryAdjustment[]>('/adjustments')
      return data || []
    },
  })
}

interface ApplyAdjustmentInput {
  inventory_item_id?: number | null
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
      return await api.post('/adjustments', input)
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
