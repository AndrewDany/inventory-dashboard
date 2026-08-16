import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

export interface UsageData {
  itemCount: number
  userCount: number
  locationCount: number
  storageUsed: number
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

      const items = (itemsRes.data ?? []) as Array<{ quantity?: number; unit_price?: number; reorder_level?: number }>
      const itemCount = items.length
      const storageUsed = items.reduce(
        (sum: number, item) => sum + (item.quantity ?? 0) * (item.unit_price ?? 0),
        0
      )

      return {
        itemCount,
        userCount: usersRes.count ?? 0,
        locationCount: locationsRes.count ?? 0,
        storageUsed,
      }
    },
  })
}

