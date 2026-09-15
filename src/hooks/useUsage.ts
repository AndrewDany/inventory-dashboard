import { useQuery } from '@tanstack/react-query'
import { api } from '../lib/apiClient'
import type { InventoryItem } from '../types/inventory'
import type { Location } from '../types/location'

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
        api.get<InventoryItem[]>('/inventory'),
        api.get<unknown[]>('/users'),
        api.get<Location[]>('/locations'),
      ])

      const items: InventoryItem[] = itemsRes || []
      const users: unknown[] = usersRes || []
      const locations: Location[] = locationsRes || []

      const itemCount = items.length
      const storageUsed = items.reduce(
        (sum: number, item: InventoryItem) => sum + (item.quantity ?? 0) * (item.unit_price ?? 0),
        0
      )

      return {
        itemCount,
        userCount: users.length,
        locationCount: locations.length,
        storageUsed,
      }
    },
  })
}
