// src/hooks/useInventoryBatches.ts
// ------------------------------------------------------------
import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'
import type { InventoryBatch } from '../types/procurement'

export interface BatchStockRow {
  id: string
  batch_id: string
  location_id: string | null
  on_hand_quantity: number
  avg_unit_cost: number | null
  updated_at: string
  inventory_batches: InventoryBatch
}

export function useInventoryBatches(sku?: string, locationId?: string) {
  return useQuery({
    queryKey: ['inventory_batches', sku ?? 'all', locationId ?? 'all'],
    queryFn: async (): Promise<BatchStockRow[]> => {
      let query = supabase
        .from('inventory_batch_stock')
        .select('*, inventory_batches!inner(*)')
        .order('updated_at', { ascending: false })

      if (sku) {
        const skuFilter = sku.trim().split(/\s+/)[0]
        // Use case-insensitive substring matching for the first token of the SKU input.
        query = query.ilike('inventory_batches.sku', `%${skuFilter}%`)
      }
      if (locationId) {
        query = query.eq('location_id', locationId)
      }

      const { data, error } = await query
      if (error) throw new Error(error.message)
      return data as unknown as BatchStockRow[]
    },
  })
}
