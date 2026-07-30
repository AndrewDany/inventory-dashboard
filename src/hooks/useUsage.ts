import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export interface UsageData {
  totalItems: number
  totalUsers: number
  totalLocations: number
  lowStockItems: number
  totalValue: number
}

export function useUsage() {
  return useQuery({
    queryKey: ['usage'],
    queryFn: async (): Promise<UsageData> => {
      const [itemsRes, usersRes, locationsRes] = await Promise.all([
        supabase.from('inventory_items').select('quantity, unit_price, reorder_level'),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('locations').select('id', { count: 'exact', head: true }),
      ])

      const items = (itemsRes.data ?? []) as any[]
      const totalItems = items.length
      const totalValue = items.reduce(
        (sum: number, item: any) => sum + (item.quantity ?? 0) * (item.unit_price ?? 0),
        0
      )
      const lowStockItems = items.filter(
        (item: any) => (item.quantity ?? 0) <= (item.reorder_level ?? 0)
      ).length

      return {
        totalItems,
        totalUsers: usersRes.count ?? 0,
        totalLocations: locationsRes.count ?? 0,
        lowStockItems,
        totalValue,
      }
    },
  })
}

