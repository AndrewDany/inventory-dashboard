import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export interface StockMovement {
  id: string
  item_id: string | null
  item_name: string
  previous_quantity: number
  new_quantity: number
  change_amount: number
  user_email: string
  created_at: string
}

export function useStockMovements() {
  return useQuery({
    queryKey: ['stock_movements'],
    queryFn: async (): Promise<StockMovement[]> => {
      const { data, error } = await supabase
        .from('stock_movements')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw new Error(error.message)
      return data as StockMovement[]
    },
  })
}