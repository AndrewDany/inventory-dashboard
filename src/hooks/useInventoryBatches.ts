import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
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
      const data = await api.get<any[]>('/batches')
      let items = (data || []).map((b) => ({
        id: b.id,
        batch_id: b.id,
        location_id: b.location_id ?? null,
        on_hand_quantity: Number(b.on_hand_quantity || 0),
        avg_unit_cost: Number(b.unit_cost || 0),
        updated_at: b.updated_at || b.received_date,
        inventory_batches: {
          id: b.id,
          sku: b.sku,
          inventory_item_id: b.inventory_item_id,
          batch_code: b.batch_code,
          expiry_date: b.expiry_date,
          received_date: b.received_date,
        },
      }))

      if (sku) {
        const s = sku.toLowerCase()
        items = items.filter((i) => i.inventory_batches.sku.toLowerCase().includes(s))
      }
      if (locationId) {
        items = items.filter((i) => i.location_id === locationId)
      }

      return items
    },
  })
}
