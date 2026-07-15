export interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string | null
  quantity: number
  reorder_level: number
  unit_price: number | null
  supplier: string | null
  location_id: string | null
  last_updated: string
  created_at: string
}