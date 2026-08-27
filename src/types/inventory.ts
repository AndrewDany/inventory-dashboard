export interface InventoryItem {
  id: string
  name: string
  sku: string
  category: string | null
  unit_type: 'unit' | 'box' | 'weight'
  unit_of_measure: 'kg' | null
  // For box items only: how many individual pieces are in one box. When set,
  // `quantity`/`reorder_level` are tracked in pieces (the base sellable
  // unit), so a box can be broken open and sold loose without losing track
  // of stock. Left null for boxes that are only ever sold sealed.
  units_per_box: number | null
  quantity: number
  reorder_level: number
  unit_price: number | null
  supplier: string | null
  location_id: string | null
  last_updated: string
  created_at: string
}