import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/apiClient'

export interface StockMovement {
  id: string
  item_id: string | null
  item_name: string
  change_amount: number
  reason?: string
  location_id?: string | null
  user_email: string
  created_at: string
}

export function useStockMovements() {
  return useQuery({
    queryKey: ['stock_movements'],
    queryFn: async (): Promise<StockMovement[]> => {
      const data = await api.get<StockMovement[]>('/movements?limit=50')
      return data || []
    },
  })
}